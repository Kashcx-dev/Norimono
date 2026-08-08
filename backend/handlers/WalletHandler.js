const db = require('../handlers/dbHandler');
const getWallet = async (req, res, next) =>{
    if(!req.user || !req.user.emp_id){
        return res.status(401).json({message: "Unauthenticated user"})
    }

    try {
        const {emp_id} = req.user;
        const result = await db.query(`SELECT wallet_id, balance, bank_connection, updated_at FROM wallets WHERE emp_id = $1`, [emp_id]);
        if(result.rows.length === 0){
            return res.status(404).json({message: "Wallet not found"});
        }
        const {wallet_id, balance, bank_connection, updated_at} = result.rows[0];
        return res.json({message: "Sucessfully got Wallet info", wallet_id, balance, bank_connection, updated_at});
    } catch (error) {
        console.log(error);
const deductAmt = async (emp_id, amount, client) => {
    // We allow the wallet to go negative so the driver is guaranteed payment
    // We can handle top-ups via Razorpay later
    await client.query(`UPDATE wallets SET balance = balance - $1 WHERE emp_id = $2`, [amount, emp_id]);
}

const creditAmt = async (emp_id, amount, client) => {
    await client.query(`UPDATE wallets SET balance = balance + $1 WHERE emp_id = $2`, [amount, emp_id]);
}

module.exports = {
    getWallet,
    deductAmt,
    creditAmt
};