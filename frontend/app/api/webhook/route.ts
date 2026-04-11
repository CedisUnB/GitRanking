import { handleIssue } from '@/lib/webhooks/handleIssue';
import { handlePr } from '@/lib/webhooks/handlePr';
import { handlePush } from '@/lib/webhooks/handlePush';

export async function POST(req: Request) {
  const event = req.headers.get("x-github-event");

  const body = await req.json();
  // In future we will use this events to trigger updates and your data base and see when a use recive a new badge for example, 
  // but for now we will just log the events to the console.
  switch (event) {
    case "issues":
      return handleIssue(body);

    case "push":
      return handlePush(body);
    
    case "pull_request":
      return handlePr(body);

    default:
      console.log("Event not handled:", event);
      return new Response("Ignored", { status: 200 });
  }
}