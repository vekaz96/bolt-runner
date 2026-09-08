import { motion } from "framer-motion";
import { useWallet } from "../wallet";
import BoltSurface from "./BoltSurface";

/** Live ⚡ balance pill shown on menu screens. */
export default function WalletPill({ className = "" }: { className?: string }) {
  const balance = useWallet();

  return (
    <motion.div
      className={`inline-flex ${className}`}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <BoltSurface name="panel-wallet" className="h-[50px] w-[156px] pl-[55px] pr-4">
        <motion.span key={balance} className="font-display font-bold text-white text-sm tabular-nums"
          initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }}>
          {balance.toLocaleString()}
        </motion.span>
      </BoltSurface>
    </motion.div>
  );
}
