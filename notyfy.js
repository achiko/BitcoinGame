

console.log(process.argv[2]);

// 1. Get transaction ID
// 2. Call Bitcoin Client:  gettransaction method:  Get Acct
// 3. Find Usersession via users collection 
// 4. Send Notification to client via socket.io 