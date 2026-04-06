export async function POST(req: Request) {
  console.log("Received webhook:");

  const body = await req.json();
  console.log(body);

  return new Response("OK", { status: 200 });
}