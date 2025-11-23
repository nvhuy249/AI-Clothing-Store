import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center w-full">

      {/* 🌟 HERO SECTION */}
      <section className="relative w-full">
        <Image
          src="/images/main-hero.png"
          alt="Hero"
          width={1920}
          height={1080}
          priority
          className="w-full h-auto object-cover"
        />

        {/* Overlay text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-black/20">
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">
            Welcome to NeuroFit
          </h1>

          <p className="text-white/90 mt-4 text-lg sm:text-xl max-w-xl drop-shadow">
            AI-powered fashion. Try on styles instantly with generative models.
          </p>

          <Link
            href="/generate"
            className="mt-6 px-8 py-3 bg-white text-black font-semibold rounded-xl shadow-lg hover:bg-gray-200 transition"
          >
            Try Now
          </Link>
        </div>
      </section>

      {/* 🪟 WINDOWS SECTION */}
      <section className="w-full max-w-6xl px-4 py-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* SHOP */}
        <Link href="/shop" className="group">
          <div className="aspect-square bg-gray-200 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-lg group-hover:shadow-xl transition">
            <Image
              src="/images/shop-hero.png"
              alt="Shop"
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg">
                Shop
              </div>
            </div>
          </div>
        </Link>

        {/* CLOSET */}
        <Link href="/closet" className="group">
          <div className="aspect-square bg-gray-200 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-lg group-hover:shadow-xl transition">
            <Image
              src="/images/closet-hero.png"
              alt="Closet"
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg">
                Closet
              </div>
            </div>

          </div>
        </Link>

        {/* LOGIN / SIGNUP */}
        <Link href="/auth" className="group">
          <div className="aspect-square bg-gray-200 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-lg group-hover:shadow-xl transition">
            <Image
              src="/images/blank-avatar.png"
              alt="Login"
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg">
                Sign In
              </div>
            </div>

          </div>
        </Link>

        {/* ABOUT US */}
        <Link href="/about" className="group">
          <div className="aspect-square bg-gray-200 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-lg group-hover:shadow-xl transition">
            <Image
              src="/images/about-hero.png"
              alt="About"
              fill
              className="object-cover opacity-80 group-hover:opacity-100 transition"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-blue-600 text-white text-xl font-semibold rounded-xl shadow-lg">
                About Us
              </div>
            </div>
          </div>
        </Link>

      </section>

    </main>
  );
}
