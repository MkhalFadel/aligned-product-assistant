const app = require("./app");

const port = process.env.PORT || 3000;

// Start the API server on the configured port.
app.listen(port, () => {
   console.log(`Server is running on port ${port}`);
});
