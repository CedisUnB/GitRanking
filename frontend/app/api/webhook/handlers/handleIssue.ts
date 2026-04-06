async function handleIssue(body: any) {
  if (body.action === "opened") {
    console.log("New issue!");
    console.log("Title:", body.issue.title);
    console.log("Author:", body.issue.user.login);
  }

  if (body.action === "closed") {
    console.log("Issue closed!");
  }

  return new Response("Issue processed", { status: 200 });
}