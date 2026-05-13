export async function handlePush(body: any) {
  console.log("Push received!");

  const commits = body.commits;

  commits.forEach((commit: any) => {
    console.log("Commit:", commit.message);
  });

  return new Response("Push processed", { status: 200 });
}
