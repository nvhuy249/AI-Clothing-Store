import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center space-y-24 py-12">
      {/* Hero Section */}
      <section className="relative w-full h-[1000px] overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/main-hero.png"
          alt="Hero background"
          fill
          priority
          className="object-cover z-0"
          sizes="100vw"
        />

        {/* Overlay Content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to NeuroFit
          </h1>
          <h2 className="text-xl text-white mb-2">an AI Fashion Store 👗</h2>
          <p className="text-gray-200 mb-6 max-w-md">
            See your clothes come to life on AI-generated models.
          </p>
          <Link
            href="/generate"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition text-lg font-semibold shadow-lg"
          >
            Try Now
          </Link>
        </div>
      </section>

      {/* Shop Section */}
      <section className="relative w-full h-auto">
        {/* Full-width Image Container */}
        <div className="relative w-full aspect-[2/1]">
          <Image
            src="/images/shop-hero.png"
            alt="Clothing item"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />

          {/* Centered Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              href="/shop"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-800 transition text-lg font-semibold shadow-lg"
            >
              Shop
            </Link>
          </div>
        </div>
      </section>

      {/* Closet Section */}
      <section className="relative w-full h-auto">
        <div className="relative w-full aspect-[2/1]">
          <Image
            src="/images/closet-hero.png"
            alt="Mannequin"
            fill
            priority
            className="object-cover rounded-lg"
            sizes="100vw"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              href="/closet"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-800 transition text-lg font-semibold shadow-lg"
            >
              Closet
            </Link>
          </div>
        </div>
      </section>

      {/* Sign In / Sign Up Section */}
      <section className="flex flex-col items-center justify-center text-center h-[600px] sm:h-[500px]">
        <h3 className="text-2xl font-semibold mb-4">Join NeuroFit</h3>
        <p className="text-gray-600 mb-6 max-w-md">
          Sign in or create an account to save your styles and closet.
        </p>
        <Link
          href="/auth"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-800 transition text-lg font-semibold shadow-lg"
        >
          Sign In / Sign Up
        </Link>
      </section>
    </main>
  );
}