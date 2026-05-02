import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-forum-bg px-4">
      {/* Auto-styled: 404 screen is not present in Figma, so it follows the forum auth/card pattern. */}
      <div className="w-full max-w-lg rounded-[28px] border border-forum-border bg-forum-surface p-8 text-center shadow-dialog sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-forum-primary">
          Error 404
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-forum-inkStrong sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 text-base leading-7 text-forum-muted">
          The route{" "}
          <span className="font-medium text-forum-inkStrong">
            {location.pathname}
          </span>{" "}
          does not exist or is no longer available.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl bg-forum-primary px-5 font-semibold text-white transition hover:bg-forum-primaryDark"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
