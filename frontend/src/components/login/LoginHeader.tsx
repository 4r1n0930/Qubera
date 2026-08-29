/**
 * Heading block at the top of the login card.
 */
export function LoginHeader() {
  return (
    <header>
      <h1 className="text-[38px] font-bold leading-tight tracking-tight text-forest md:text-[42px]">
        Welcome back
      </h1>
      <p className="mt-3 text-[16px] text-inkmuted md:text-[17px]">
        Continue your journey into quantum computing.
      </p>
    </header>
  );
}
