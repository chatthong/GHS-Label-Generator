module.exports = {
  apps: [
    {
      name: "MYCHEMLABEL.COM-P3002",
      script: "yarn",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },
  ],
};
