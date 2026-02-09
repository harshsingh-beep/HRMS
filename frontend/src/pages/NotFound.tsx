import { motion } from "framer-motion";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="inline-block"
        >
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <FileQuestion size={36} className="text-muted-foreground" />
          </div>
        </motion.div>
        <div>
          <h1 className="text-6xl font-extrabold text-foreground">404</h1>
          <p className="text-lg text-muted-foreground mt-2">This page doesn't exist</p>
        </div>
        <Button onClick={() => navigate("/")} className="gap-2 mt-4">
          <ArrowLeft size={16} /> Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
