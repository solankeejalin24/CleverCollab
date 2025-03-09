/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    JIRA_BASE_URL: process.env.JIRA_BASE_URL,
    JIRA_USER: process.env.JIRA_USER,
    JIRA_API_TOKEN: process.env.JIRA_API_TOKEN,
  },
}

module.exports = nextConfig
