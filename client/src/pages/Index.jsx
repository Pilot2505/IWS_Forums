import useRequireAuth from "../hooks/useRequireAuth";

export default function Index() {
  useRequireAuth({
    redirectTo: "/register",
    authenticatedTo: "/home",
    requireToken: false,
  });

  return null;
}