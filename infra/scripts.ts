import {
  ECSClient,
  ListTasksCommand,
  waitUntilServicesStable,
} from "@aws-sdk/client-ecs";
import { spawn } from "child_process";

export default function ecs(profile: string) {
  // Initialize the client (it will pick up credentials/region from your SST environment)
  const client = new ECSClient({
    profile,
  });

  async function waitForService(
    cluster: string,
    service: string,
  ): Promise<string> {
    console.log("Waiting for service to be stable...");

    // EQUIVALENT TO: aws ecs wait services-stable
    // This polls the API every 15 seconds (default) until the service reaches a steady state
    await waitUntilServicesStable(
      {
        client,
        // Wait up to 30min
        maxWaitTime: 1800,
      },
      {
        cluster,
        services: [service],
      },
    );

    console.log("Service is stable! getting Task ID...");

    // EQUIVALENT TO: aws ecs list-tasks
    const command = new ListTasksCommand({
      cluster,
      serviceName: service,
    });

    const response = await client.send(command);

    if (response?.taskArns === undefined || response.taskArns.length === 0) {
      throw new Error(`No tasks found for service ${service}`);
    }

    return response.taskArns[0];
  }

  async function runGenerateAdminKey(
    cluster: string,
    container: string,
    task: string,
  ) {
    try {
      console.log("🔌 Connecting to Session Manager using: ");
      console.log("Cluster:", cluster);
      console.log("Container:", container);
      console.log("Task:", task);
      console.log("Profile:", profile);

      const proc = spawn(
        "aws",
        [
          "ecs",
          "execute-command",
          "--cluster",
          cluster,
          "--task",
          task,
          "--container",
          container,
          "--command",
          "./generate_admin_key.sh",
          "--interactive",
          ...(profile ? ["--profile", profile] : []),
        ],
        {
          stdio: ["pipe", "pipe", "pipe"], // stdin, stdout, stderr as pipes
        },
      );

      let output = "";

      proc.stdout.on("data", (data) => {
        output += data.toString();
      });

      proc.stderr.on("data", (data) => {
        console.error("STDERR:", data.toString());
      });

      proc.on("close", (code) => {
        if (code === 0) {
          const adminKeyMatch = output.match(
            /(Admin key:\s*\n\s*[^\n|]+\|[0-9a-fA-F]+)/,
          );

          if (adminKeyMatch && adminKeyMatch[1]) {
            const adminKeyLine = adminKeyMatch[1].replace(/\s+/g, " ").trim();
            console.log("---\n");
            console.log("🔑:", adminKeyLine); //
            console.log("---\n");
          } else {
            console.log("---\n");
            console.log(output);
            console.log("---\n");
            throw new Error("Admin Key not found.");
          }
        } else {
          console.error(`Process exited with code ${code}`);
        }
      });

      // Handle potential errors
      proc.on("error", (error) => {
        console.error("Failed to start process:", error);
      });
    } catch (error) {
      console.error("Error Trying to generate admin key:", error);
    }
  }

  return {
    waitForService,
    runGenerateAdminKey,
  };
}
