"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["fair", "inclusive", "intelligent", "ethical", "empowering"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev + 1) % titles.length);
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-20 items-center justify-center flex-col mt-20">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Introducing UtopiaHire <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-spektr-cyan-50">Empowering a</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : { y: titleNumber > index ? -150 : 150, opacity: 0 }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
              <span> future of employment</span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              UtopiaHire is an AI-powered career platform designed to promote fairness 
              and inclusivity in hiring across Africa and the MENA region. It helps job 
              seekers enhance their resumes, discover locally relevant opportunities, 
              and prepare confidently for interviews — all powered by ethical, 
              transparent, and human-centered AI.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            {/* <Button size="lg" className="gap-4" variant="outline">
              Explore Features <Sparkles className="w-4 h-4" />
            </Button> */}
            <Button size="lg" className="gap-4" asChild>
              <a href="/auth/login">
              Get Started <MoveRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
