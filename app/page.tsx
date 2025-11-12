import Link from "next/link";

export default function Home() {
  return (
    <section className="text-center mt-20">
      <h1 className="text-4xl font-bold mb-4">Welcome to NeuroFit <br></br></h1>
      <h2>an AI Fashion Store 👗</h2> 
      <p className="text-gray-600 mb-6">
        See your clothes come to life on AI-generated models.
      </p>
      <Link
        href="/generate"
        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
      >
        Try Now
      </Link>
    </section>
  );
}
