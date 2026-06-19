import Link from "next/link";

export default function NotFound() {
  return (
    <div className="hero py-20">
      <div className="hero-content text-center">
        <div>
          <h1 className="text-3xl font-bold">Not found</h1>
          <p className="py-3 opacity-70">
            That page or tournament doesn&apos;t exist.
          </p>
          <Link href="/" className="btn btn-primary">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
