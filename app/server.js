const express = require("express");

const app = express();

const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
    res.json({
        project: "Enterprise DevSecOps Pipeline",
        status: "Running"
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "Healthy"
    });
});

app.get("/version", (req, res) => {
    res.json({
        version: "1.0.0"
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;