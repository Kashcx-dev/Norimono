const db = require('../handlers/dbHandler');
const getWallet = async (req, res, next) =>{
    if(!req.user || !req.user.emp_id){
        return res.status(401).json({message: "Unauthenticated user"})
    }

    try {
        const {emp_id} = req.user;
        let result = await db.query(`SELECT wallet_id, balance, bank_connection, updated_at FROM wallets WHERE emp_id = $1`, [emp_id]);
        if(result.rows.length === 0){
            await db.query(`INSERT INTO wallets (emp_id, balance) VALUES ($1, $2)`, [emp_id, 500.00]);
            result = await db.query(`SELECT wallet_id, balance, bank_connection, updated_at FROM wallets WHERE emp_id = $1`, [emp_id]);
        }
        const {wallet_id, balance, bank_connection, updated_at} = result.rows[0];
        return res.json({
            success: true,
            wallet: {
                wallet_id, 
                balance: parseFloat(balance), 
                bank_connection, 
                updated_at
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Internal Server Error"});
    }
}

const recordTransaction = async (emp_id, ride_id, type, amount, description, client = db) => {
    try {
        await client.query(
            `INSERT INTO wallet_transactions (emp_id, ride_id, type, amount, description) 
             VALUES ($1, $2, $3, $4, $5)`,
            [emp_id, ride_id || null, type, amount, description || null]
        );
    } catch (err) {
        console.error("Error recording wallet transaction:", err.message);
    }
};

const getTransactions = async (req, res, next) => {
    if (!req.user || !req.user.emp_id) {
        return res.status(401).json({ success: false, message: "Unauthenticated user" });
    }

    try {
        const { emp_id } = req.user;
        const result = await db.query(
            `SELECT transaction_id, ride_id, type, amount, description, created_at 
             FROM wallet_transactions 
             WHERE emp_id = $1 
             ORDER BY created_at DESC 
             LIMIT 30`,
            [emp_id]
        );

        return res.json({
            success: true,
            transactions: result.rows
        });
    } catch (err) {
        console.error("Error fetching wallet transactions:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch transactions" });
    }
};

const addMoney = async (req, res, next) => {
    if(!req.user || !req.user.emp_id){
        return res.status(401).json({success: false, message: "Unauthenticated user"})
    }
    
    try {
        const { emp_id } = req.user;
        const { amount } = req.body;
        
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }
        
        const numAmount = parseFloat(amount);
        const result = await db.query(`UPDATE wallets SET balance = balance + $1 WHERE emp_id = $2 RETURNING balance`, [numAmount, emp_id]);
        let newBalance;
        if (result.rows.length === 0) {
            const initialBalance = 500.00 + numAmount;
            await db.query(`INSERT INTO wallets (emp_id, balance) VALUES ($1, $2)`, [emp_id, initialBalance]);
            newBalance = initialBalance;
        } else {
            newBalance = result.rows[0].balance;
        }

        await recordTransaction(emp_id, null, 'wallet_topup', numAmount, 'Corporate Wallet Top-up (Online Payment)');
        
        return res.json({ success: true, message: "Money added successfully", balance: newBalance });
    } catch (error) {
        console.error("Error adding money:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const deductAmt = async (emp_id, amount, client, ride_id = null, description = null) => {
    // We allow the wallet to go negative so the driver is guaranteed payment
    await client.query(`UPDATE wallets SET balance = balance - $1 WHERE emp_id = $2`, [amount, emp_id]);
    if (description || ride_id) {
        await recordTransaction(emp_id, ride_id, 'fare_deduction', amount, description || 'Ride Fare Deduction', client);
    }
}

const creditAmt = async (emp_id, amount, client, ride_id = null, type = 'driver_earnings', description = null) => {
    await client.query(`UPDATE wallets SET balance = balance + $1 WHERE emp_id = $2`, [amount, emp_id]);
    if (description || ride_id) {
        await recordTransaction(emp_id, ride_id, type, amount, description || 'Ride Earnings Credit', client);
    }
}

module.exports = {
    getWallet,
    getTransactions,
    addMoney,
    deductAmt,
    creditAmt,
    recordTransaction
};