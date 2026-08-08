const express = require("express");
const router = express.Router();
const db = require("../handlers/dbHandler");
const ikg = require("../handlers/ikg");
const crypto = require("crypto");
const multer = require("multer");

/*MULTER CONFIG*/
const storage= multer.diskStorage({
    destination: (req, res, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Setup DOMPurify to run on the backend using JSDOM
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Get or create a 1-on-1 conversation
router.post('/conversation/direct', async (req, res, next) => {
    const { target_user } = req.body;
    const currentUser = req.user.username;

    if (!target_user) return res.status(400).json({ error: "target_user is required" });

    try {
        // Check if 1-on-1 exists
        const query = `
            SELECT c.id 
            FROM conversations c
            JOIN conversation_participants p1 ON c.id = p1.conversation_id
            JOIN conversation_participants p2 ON c.id = p2.conversation_id
            WHERE c.is_group = false 
            AND p1.user_id = $1 
            AND p2.user_id = $2
        `;
        const result = await db.query(query, [currentUser, target_user]);

        if (result.rows.length > 0) {
            return res.json({ conversation_id: result.rows[0].id });
        } else {
            // Create new conversation in a transaction
            const newId = crypto.randomUUID();
            await db.query('BEGIN');
            try {
                await db.query(`INSERT INTO conversations (id, is_group, created_at) VALUES ($1, false, $2)`, [newId, Date.now()]);
                await db.query(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)`, [newId, currentUser]);
                await db.query(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)`, [newId, target_user]);
                await db.query('COMMIT');
                res.json({ conversation_id: newId });
            } catch (txErr) {
                await db.query('ROLLBACK');
                throw txErr;
            }
        }
    } catch (err) {
        return next(err);
    }
});

router.post('/conversation/group/create', async (req, res, next) => {
    const { chain_data, groupName } = req.body;
    const groupCreator = req.user.username;

    const groupID = crypto.randomUUID();

    if (!chain_data || chain_data.length < 3) {
        return res.status(400).json({ message: "You can NOT create a group with less than 3 members..." });
    }
    if(chain_data.some(chain_link => chain_link.user_id === "ikg_bot")){
        return res.status(403).json({message:"you can NOT add ikg_bot as a group member"});
    }

    try {
        await db.query('BEGIN');

        await db.query('INSERT INTO conversations (id, is_group, name, created_at) VALUES ($1, true, $2, $3)', [groupID, groupName, Date.now()]);
        

        for (const link of chain_data) {
            const role = (link.user_id === groupCreator) ? 'admin' : 'member';
            await db.query(
                'INSERT INTO conversation_participants (conversation_id, user_id, role, join_order, group_public_key) VALUES ($1, $2, $3, $4, $5)', 
                [groupID, link.user_id, role, link.join_order, link.group_public_key]
            );
        }

        await db.query('COMMIT');
        return res.status(200).json({ groupID: groupID, message: "Group created sucessfully" });
    } catch (err) {
        await db.query('ROLLBACK');
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error in group creation" });
    }
});

router.post('/conversation/group/add', async (req, res, next) => {
    const { chain_link, groupID } = req.body;
    const currentUser = req.user.username;

    try {
        // Check if the current user is an admin of this group
        const roleCheck = await db.query(
            'SELECT role FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [groupID, currentUser]
        );

        if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'admin') {
            return res.status(403).json({ message: "You must be a group admin to add members!" });
        }

        if(chain_link.user_id === 'ikg_bot'){
            return res.status(403).json({message:"you can NOT add ikg_bot as a group member"});
        }
        await db.query(
            'INSERT INTO conversation_participants (conversation_id, user_id, role, join_order, group_public_key) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING', 
            [groupID, chain_link.user_id, 'member', chain_link.join_order, chain_link.group_public_key]
        );
        return res.status(200).json({ message: "User added to group successfully" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error in adding user to group" });
    }
});

router.post('/conversation/group/delete', async (req, res, next) => {
    const { groupId, groupName, } = req.body;
    const currentUser = req.user.username;

    try {
        const roleCheck = await db.query(
            'SELECT role FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [groupId, currentUser]
        );

        if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'admin') {
            return res.status(403).json({ message: "You must be a group admin to delete the group!" });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }

    try {
        await db.query(`DELETE FROM conversations WHERE id = $1`, [groupId]);
        return res.status(200).json({ message: "Group deleted successfully" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error in deleting group" });
    }
});

router.post('/conversation/group/leave', async (req, res, next) => {
    const { groupId } = req.body;
    const currentUser = req.user.username;

    try {
        const countResult = await db.query('SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = $1', [groupId]);
        const count = parseInt(countResult.rows[0].count);
        if (count <= 3) {
            return res.status(402).json("you can not have a group with less than three members...");
        }

        const roleCheck = await db.query(
            'SELECT role FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [groupId, currentUser]
        );

        if (roleCheck.rows.length === 0 || roleCheck.rows[0].role === 'admin') {
            //set the next person as admin and remove admin
            await db.query('UPDATE conversation_participants SET role = $1 WHERE conversation_id = $2 AND user_id = (SELECT user_id FROM conversation_participants WHERE conversation_id = $2 AND NOT role = $3 LIMIT 1)', ['admin', groupId, 'admin']);
            await db.query('DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [groupId, currentUser]);
            return res.status(200).json({ message: "You left the group successfully" });
            //need to send a system message in middle div saying "you {the name aactually} are new group admin"
        }
        await db.query('DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [groupId, currentUser]);
        return res.status(200).json({ message: "You left the group successfully" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
});

router.post('/conversation/group/kick', async (req, res, next) => {
    const { groupId, targetUser } = req.body;
    const currentUser = req.user.username;

    if (currentUser === targetUser) return res.status(400).json({ message: "You cannot kick yourself. Use leave instead." });

    try {
        const roleCheck = await db.query(
            'SELECT role FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [groupId, currentUser]
        );

        if (roleCheck.rows.length === 0 || roleCheck.rows[0].role === 'member') {
            return res.status(403).json({ message: "You must be an admin or manager to kick members!" });
        }

        const targetRoleCheck = await db.query(
            'SELECT role FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [groupId, targetUser]
        );

        if (targetRoleCheck.rows.length === 0) {
            return res.status(404).json({ message: "Target user not in group" });
        }

        if (roleCheck.rows[0].role === 'manager' && (targetRoleCheck.rows[0].role === 'admin' || targetRoleCheck.rows[0].role === 'manager')) {
            return res.status(403).json({ message: "Managers cannot kick admins or other managers" });
        }

        await db.query('DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [groupId, targetUser]);
        return res.status(200).json({ message: "User kicked successfully" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

//only one admin, but multiple managers. Managers can do EVERYTHING except group deletion or kick admin.

//ROLES: ADMIN [ONLY 1], MANAGER [MULTIPLE], MEMBER[MULTIPLER]
router.post('/conversations/group/setRole', async (req, res, next) => {
    const { target_user, groupID, newRole } = req.body;
    const currentUser = req.user.username;
    if (target_user === currentUser) {
        return res.status(400).json("YOU can not set new Role to yourself!");
    }

    try {
        const roleCheck = await db.query(
            'SELECT role FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [groupID, currentUser]
        );

        if (roleCheck.rows.length === 0 || roleCheck.rows[0].role === 'member') {
            return res.status(403).json({ message: "members can NOT set roles" });
        }

        if (roleCheck.rows[0].role === "manager" && newRole === "admin") {
            return res.status(403).json({ message: "managers can NOT set admin role" });
        }

        await db.query(`UPDATE conversation_participants SET role = $1 WHERE user_id = $2 AND conversation_id = $3`, [newRole, target_user, groupID]);
        return res.status(200).json({ message: "Role set successfully" });

    } catch (err) {
        return res.status(500).json({ message: "Internal server error..." });
    }
});

router.get('/conversation/group/keys/:groupID', async (req, res, next) => {
    const { groupID } = req.params;
    const currentUser = req.user.username;
    try {
        // Verify user is in the group
        const memberCheck = await db.query(
            'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [groupID, currentUser]
        );
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: "Not a group member" });
        // Fetch the key chain
        const result = await db.query(`
            SELECT p.user_id, p.join_order, p.group_public_key, u.public_key as identity_public_key
            FROM conversation_participants p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.conversation_id = $1
            ORDER BY p.join_order ASC
        `, [groupID]);
        return res.json({ keys: result.rows });
    } catch (err) {
        console.error("Fetch group keys error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/conversation/group/members/:groupId', async (req, res, next) => {
    const { groupId } = req.params;
    const currentUser = req.user.username;
    try {
        const memberCheck = await db.query(
            'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
            [groupId, currentUser]
        );
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: "Not a group member" });

        const result = await db.query(`
            SELECT p.user_id, p.role, p.join_order, u.profile_picture 
            FROM conversation_participants p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.conversation_id = $1
            ORDER BY 
                CASE role 
                    WHEN 'admin' THEN 1 
                    WHEN 'manager' THEN 2 
                    ELSE 3 
                END, p.join_order ASC
        `, [groupId]);
        return res.json({ members: result.rows });
    } catch (err) {
        console.error("Fetch group members error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/users', async (req, res) => {
    const currentUser = req.user.username;
    const searchPattern = `%${req.query.search || ""}%`;

    try {
        const result = await db.query(`
            SELECT user_id, 0 as unread_count, profile_picture, bio 
            FROM users 
            WHERE user_id != $1 AND user_id ILIKE $2 
            LIMIT 10
        `, [currentUser, searchPattern]);
        res.json({ users: result.rows });
    } catch (err) {
        console.error("Fetch users err:", err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET /conversations - to list user's active conversations
router.get('/conversations', async (req, res, next) => {
    const currentUser = req.user.username;
    const query = `
        SELECT c.id, c.is_group, c.name, 
               (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != $1 LIMIT 1) as other_user,
               (SELECT profile_picture FROM users WHERE user_id = (SELECT user_id FROM conversation_participants WHERE conversation_id = c.id AND user_id != $2 LIMIT 1)) as profile_picture,
               (SELECT message FROM chat_logs WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message,
               (SELECT sender_id FROM chat_logs WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_sender,
               (SELECT timestamp FROM chat_logs WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_timestamp,
               (SELECT COUNT(*) FROM chat_logs 
                WHERE conversation_id = c.id 
                AND chat_id > COALESCE(cp.last_read_message_id, 0) 
                AND sender_id != $3) as unread_count
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = $4
        ORDER BY last_timestamp DESC NULLS LAST
    `;

    try {
        const result = await db.query(query, [currentUser, currentUser, currentUser, currentUser]);
        res.json({ conversations: result.rows });
    } catch (err) {
        return next(err);
    }
});

router.post('/message', async (req, res, next) => {
    let { conversation_id, message, recipient, bot_prompt, isGroup } = req.body;
    const sender_id = req.user.username;

    // Sanitize message to prevent XSS attacks before saving to database
    message = DOMPurify.sanitize(message);
    const sanitizedBotPrompt = bot_prompt ? DOMPurify.sanitize(bot_prompt).trim() : null;

    if (!message || message.trim() === "") {
        return res.status(400).json({ error: "Message content cannot be empty" });
    }
    const messageText = message.trim();

    const processMessage = async (convo_id) => {
        const participantsRes = await db.query('SELECT user_id FROM conversation_participants WHERE conversation_id = $1', [convo_id]);
        const participants = participantsRes.rows.map(r => r.user_id);
        
        if (!participants.includes(sender_id)) {
            return res.status(403).json({ error: "Access denied: Not a participant in this conversation." });
        }

        const isDirectWithBot = participants.length <= 2 && participants.includes('ikg_bot');

        // Bot logic
        let triggerBot = false;
        let prompt = "";

        if (isDirectWithBot) {
            triggerBot = true;
            prompt = messageText;
        } else if (sanitizedBotPrompt) {
            triggerBot = true;
            prompt = sanitizedBotPrompt;
        } else if (messageText.includes('@ikg')) {//practically no user but safety net
            triggerBot = true;
            prompt = messageText.split('@ikg')[1].trim();
        }

        if (triggerBot && prompt.trim() !== "") {
            ikg.getBotAnswer(prompt).then(async botAns => {
                const botTimestamp = Date.now();
                const botMessage = isDirectWithBot ? botAns : `IKG: ${botAns}`;

                try {
                    const insertRes = await db.query(
                        `INSERT INTO chat_logs (conversation_id, sender_id, message, timestamp) VALUES ($1, $2, $3, $4) RETURNING chat_id`,
                        [convo_id, "ikg_bot", botMessage, botTimestamp]
                    );
                    const botChatId = insertRes.rows[0].chat_id;

                    const io = req.app.get("socketio");
                    if (io) {
                        io.to(convo_id.toString()).emit("new_message", {
                            chat_id: botChatId,
                            conversation_id: convo_id,
                            sender_id: "ikg_bot",
                            message: botMessage,
                            timestamp: botTimestamp,
                            reaction: null
                        });
                    }
                } catch (err) {
                    console.error("Error saving bot response:", err);
                }
            }).catch(err => console.error("IKG getBotAnswer failed:", err));
        }

        const timestamp = Date.now();
        try {
            const insertRes = await db.query(
                `INSERT INTO chat_logs (conversation_id, sender_id, message, timestamp) VALUES ($1, $2, $3, $4) RETURNING chat_id`,
                [convo_id, sender_id, messageText, timestamp]
            );
            const newChatId = insertRes.rows[0].chat_id;

            const io = req.app.get("socketio");
            if (io) {
                // Emit to the conversation room instead of specific socket ID
                io.to(convo_id.toString()).emit("new_message", {
                    chat_id: newChatId,
                    conversation_id: convo_id,
                    sender_id: sender_id,
                    message: messageText,
                    timestamp: timestamp,
                    reaction: null
                });
            }

            res.json({ success: true, message: "Message sent successfully", chat_id: newChatId, timestamp: timestamp, conversation_id: convo_id });
        } catch (err) {
            return next(err);
        }
    };

    try {
        // Auto-resolve recipient to a conversation_id to prevent frontend breakage initially
        if (!conversation_id && recipient) {
            const result = await db.query(`
                SELECT c.id 
                FROM conversations c
                JOIN conversation_participants p1 ON c.id = p1.conversation_id
                JOIN conversation_participants p2 ON c.id = p2.conversation_id
                WHERE c.is_group = false AND p1.user_id = $1 AND p2.user_id = $2
            `, [sender_id, recipient]);

            if (result.rows.length > 0) {
                await processMessage(result.rows[0].id);
            } else {
                // Create new convo if it doesn't exist
                const newId = crypto.randomUUID();
                await db.query('BEGIN');
                try {
                    await db.query(`INSERT INTO conversations (id, is_group, created_at) VALUES ($1, false, $2)`, [newId, Date.now()]);
                    await db.query(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)`, [newId, sender_id]);
                    await db.query(`INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)`, [newId, recipient]);
                    await db.query('COMMIT');
                    await processMessage(newId);
                } catch (txErr) {
                    await db.query('ROLLBACK');
                    throw txErr;
                }
            }
        } else if (conversation_id) {
            await processMessage(conversation_id);
        } else {
            return res.status(400).json({ error: "conversation_id or recipient is required" });
        }
    } catch (err) {
        return next(err);
    }
});

router.get('/public-key/:username', async (req, res, next) => {
    const username = req.params.username;

    try {
        const result = await db.query('SELECT public_key FROM users WHERE user_id = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json({ public_key: result.rows[0].public_key });
    } catch (err) {
        return next(err);
    }
});

router.get('/history/:conversation_id', async (req, res, next) => {
    const param = req.params.conversation_id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const sender_id = req.user.username;

    async function fetchHistory(convo_id) {
        try {
            // Security check: Must be a participant
            const memberCheck = await db.query('SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [convo_id, sender_id]);
            if (memberCheck.rows.length === 0) {
                return res.status(403).json({ error: "Access denied: Not a participant in this conversation." });
            }

            const result = await db.query(
                `SELECT c.chat_id, c.conversation_id, c.sender_id, c.message, c.timestamp,
                   (SELECT json_agg(json_build_object('user_id', r.user_id, 'reaction', r.reaction)) 
                    FROM message_reactions r 
                    WHERE r.chat_id = c.chat_id) as reactions
                 FROM chat_logs c
                 WHERE c.conversation_id = $1
                 ORDER BY c.timestamp DESC
                 LIMIT $2 OFFSET $3`,
                [convo_id, limit, offset]
            );

            // Format reactions
            const parsedMessages = result.rows.map(msg => ({
                ...msg,
                reactions: msg.reactions ? msg.reactions : [] // json_agg returns array of objects naturally, or null
            }));

            res.json({ messages: parsedMessages.reverse() });
        } catch (err) {
            return next(err);
        }
    }

    try {
        // Check if it's a UUID (length 36)
        if (param.length !== 36) {
            // It's likely a username (the old recipient approach)
            const result = await db.query(`
                SELECT c.id 
                FROM conversations c
                JOIN conversation_participants p1 ON c.id = p1.conversation_id
                JOIN conversation_participants p2 ON c.id = p2.conversation_id
                WHERE c.is_group = false AND p1.user_id = $1 AND p2.user_id = $2
            `, [sender_id, param]);

            if (result.rows.length === 0) {
                return res.json({ messages: [] }); // No history yet
            }

            await fetchHistory(result.rows[0].id);
        } else {
            await fetchHistory(param);
        }
    } catch (err) {
        return next(err);
    }
});

router.post('/reaction', async (req, res, next) => {
    const { chat_id, reaction } = req.body;
    const user_id = req.user.username;

    if (!chat_id) return res.status(400).json({ error: "Chat ID required" });

    try {
        const result = await db.query(`SELECT conversation_id FROM chat_logs WHERE chat_id = $1`, [chat_id]);
        const row = result.rows[0];
        if (!row) return next(new Error("Message not found"));
        const convo_id = row.conversation_id;

        if (!reaction) {
            // Delete reaction
            await db.query(`DELETE FROM message_reactions WHERE chat_id = $1 AND user_id = $2`, [chat_id, user_id]);
            const io = req.app.get("socketio");
            if (io) io.to(convo_id).emit("new_reaction", { chat_id, user_id, reaction: null });
            res.json({ success: true, reaction: null });
        } else {
            // Add or update reaction
            await db.query(`
                INSERT INTO message_reactions (chat_id, user_id, reaction) 
                VALUES ($1, $2, $3) 
                ON CONFLICT (chat_id, user_id) 
                DO UPDATE SET reaction = EXCLUDED.reaction
            `, [chat_id, user_id, reaction]);

            const io = req.app.get("socketio");
            if (io) io.to(convo_id).emit("new_reaction", { chat_id, user_id, reaction });
            res.json({ success: true, reaction });
        }
    } catch (err) {
        return next(err);
    }
});

router.post('/read', async (req, res, next) => {
    const { conversation_id, last_read_message_id } = req.body;
    const user_id = req.user.username;

    if (!conversation_id || !last_read_message_id) return res.status(400).json({ error: "Missing params" });

    try {
        const memberCheck = await db.query('SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2', [conversation_id, user_id]);
        if (memberCheck.rows.length === 0) return res.status(403).json({ error: "Access denied" });

        await db.query(
            `UPDATE conversation_participants SET last_read_message_id = $1 WHERE conversation_id = $2 AND user_id = $3`,
            [last_read_message_id, conversation_id, user_id]
        );
        res.json({ success: true });
    } catch (err) {
        return next(err);
    }
});

router.post('/upload', upload.array('files', 10), (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
    }

    // Return the list of uploaded file paths back to the client
    const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        path: `/uploads/${file.filename}`
    }));

    return res.status(200).json({ 
        message: "Attachments successful", 
        files: uploadedFiles 
    });
});


module.exports = router;
