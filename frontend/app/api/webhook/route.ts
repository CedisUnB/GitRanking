import { handleIssue } from './handlers/handleIssue';
import { handlePush } from './handlers/handlePush';

export async function POST(req: Request) {
  console.log("Received webhook:");
  const event = req.headers.get("x-github-event");

  const body = await req.json();
  console.log(body);
  switch (event) {
    case "issues":
      return handleIssue(body);

    case "push":
      return handlePush(body);

    default:
      console.log("Event not handled:", event);
      return new Response("Ignored", { status: 200 });
  }
}