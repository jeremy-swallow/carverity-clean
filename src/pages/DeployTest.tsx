// src/pages/DeployTest.tsx

export default function DeployTest() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-4">
        Deployment Check
      </h1>

      <p className="text-muted-foreground mb-4">
        This page exists only to confirm that deployments are working correctly after the Vercel upgrade.
      </p>

      <p className="text-muted-foreground">
        If you can see this page in production, the deployment was successful.
      </p>
    </div>
  );
}
