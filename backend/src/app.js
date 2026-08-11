const express = require("express");
const cors = require("cors");

const { env } = require("./config/env");
const { authRouter } = require("./routes/auth.routes");
const { smtpRouter } = require("./routes/smtp.routes");
const { contactRouter } = require("./routes/contact.routes");
const { contactListRouter } = require("./routes/contactList.routes");
const { campaignRouter } = require("./routes/campaign.routes");
const { templateRouter } = require("./routes/template.routes");
const { logRouter } = require("./routes/log.routes");
const { analyticsRouter } = require("./routes/analytics.routes");
const { notificationRouter } = require("./routes/notification.routes");
const { searchRouter } = require("./routes/search.routes");
const { webhookRouter } = require("./routes/webhook.routes");
const { publicRouter } = require("./routes/public.routes");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/errorMiddleware");

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/health", (request, response) => {
  response.status(200).json({
    success: true,
    message: "Backend is running",
    data: { status: "ok" },
  });
});

app.use("/api/auth", authRouter);
app.use("/api/smtp", smtpRouter);
app.use("/api/contacts", contactRouter);
app.use("/api/lists", contactListRouter);
app.use("/api/campaigns", campaignRouter);
app.use("/api/templates", templateRouter);
app.use("/api/logs", logRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/search", searchRouter);
app.use("/api/webhooks", webhookRouter);
app.use("/api/public", publicRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
