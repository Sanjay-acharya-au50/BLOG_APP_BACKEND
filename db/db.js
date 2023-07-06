const mongoose = require("mongoose");
// san123
mongoose
  .connect("mongodb+srv://san:san123@blgog.nkjz4zc.mongodb.net/db")
  .then(() => console.log("DB connected"))
  .catch((err) => console.log(err));
