export default function DeployTest() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "40px",
        color: "#fff",
      }}
    >
      <h1 style={{ marginBottom: 12 }}>Deployment Check</h1>
      <p>
        This page exists only to confirm that deployments are working
        correctly after the Vercel upgrade.
      </p>
      <p style={{ opacity: 0.7, marginTop: 12 }}>
        If you can see this page in production, the deployment was successful.
      </p>
    </div>
  );
}
