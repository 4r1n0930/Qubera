import { QuberaLogo } from "./QuberaLogo";
import { QuantumSubtitle } from "./QuantumSubtitle";
import { DividerDiamond } from "./DividerDiamond";
import { QuantumAtom } from "./QuantumAtom";
import { QuantumDecorations } from "./QuantumDecorations";
import { ExplorationTagline } from "./ExplorationTagline";

/**
 * Left branding panel: ivory background holding the QUBERA wordmark, subtitle,
 * the large quantum atom illustration, faint scientific decorations and the
 * exploration tagline at the bottom.
 */
export function QuantumBrandPanel() {
  return (
    <section
      aria-label="QUBERA branding"
      className="relative hidden h-full w-[51%] max-w-[51%] flex-col items-center overflow-hidden bg-ivory px-10 py-14 md:flex"
    >
      <QuantumDecorations />

      <div className="relative z-10 flex flex-col items-center pt-6">
        <QuberaLogo className="text-[62px] leading-none md:text-[58px] xl:text-[66px]" />
        <div className="mt-5">
          <QuantumSubtitle />
        </div>
        <div className="mt-7">
          <DividerDiamond />
        </div>
      </div>

      {/* Atom occupies the central bulk of the panel */}
      <div className="relative z-10 float-slow mt-8 flex w-[70%] max-w-[620px] flex-1 items-center justify-center md:w-[72%]">
        <div className="relative aspect-square w-full">
          <QuantumAtom />
        </div>
      </div>

      <div className="relative z-10 pb-2">
        <ExplorationTagline />
      </div>
    </section>
  );
}
