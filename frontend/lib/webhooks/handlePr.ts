export async function handlePr(body: any) {
  if (body.action === "opened") {
    console.log("New PR opened!");
    console.log("Title:", body.pull_request.title);
    console.log("Author:", body.pull_request.user.login);
  }
  
  if (body.action === "closed") {
    console.log("PR closed!");
  }

	return new Response("PR processed", { status: 200 });

}