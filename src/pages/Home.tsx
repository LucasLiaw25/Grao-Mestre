import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Droplets, Coffee } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { Footer } from "@/components/Footer";
import type { ProductResponseDTO } from "@/types";

export default function Home() {
  const { scrollY } = useScroll();
  const { data: products, isLoading } = useQuery<ProductResponseDTO[]>({
    queryKey: ["products"],
    queryFn: async () => (await productsApi.getAll()).data,
  });

  const heroY = useTransform(scrollY, [0, 1000], [0, 400]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  // Smooth section background transitions based on scroll
  const featuresBackground = useTransform(
    scrollY,
    [300, 600, 900, 1200],
    [
      "hsl(30, 25%, 97%)",
      "hsl(32, 28%, 95%)",
      "hsl(28, 20%, 93%)",
      "hsl(30, 25%, 97%)",
    ]
  );

  const featuredProducts = products?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background z-10" />
          <img
            src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=2000"
            alt="Premium coffee roasting"
            className="w-full h-full object-cover"
          />
        </motion.div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-16">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="section-label drop-shadow-md mb-6"
          >
            Qualidade Excepcional
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-8 leading-[1.1]"
          >
            O Grande Mestre
            <br />
            <span className="text-primary-foreground/90 italic">de Torra.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
          >
           Experimente café de origem ética, meticulosamente torrado, entregue diretamente na sua porta. Um ritual que vale a pena acordar para.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/products" className="btn-hero-primary w-full sm:w-auto">
              Colção de Produtos
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/about" className="btn-hero-ghost w-full sm:w-auto">
              Nossa História
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-primary-foreground/60"
        >
          <span className="text-xs uppercase tracking-widest font-semibold">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-primary-foreground/60 to-transparent" />
        </motion.div>
      </section>

      {/* FEATURES */}
      <motion.section id="features" style={{ backgroundColor: featuresBackground }} className="py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Leaf, title: "De Origem Ética", desc: "Relações comerciais diretas com agricultores garantindo salários justos e práticas sustentáveis." },
              { icon: Droplets, title: "Torrado em Pequenos Lotes", desc: "Torrado semanalmente sob encomenda em nossa instalação local para garantir frescor e sabor máximos." },
              { icon: Coffee, title: "Perfeitamente Feito", desc: "Perfis curados projetados para destacar o terroir único de cada grão." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-accent rounded-2xl flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FEATURED PRODUCTS */}
      <section className="py-24 bg-muted/30 relative z-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <span className="section-label">Ofertas Frescas</span>
              <h2 className="section-title">Torrados em Destaque</h2>
            </motion.div>
            <Link
              to="/products"
              className="group flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors pb-2 border-b-2 border-transparent hover:border-primary"
            >
              Veja Todos os Grãos
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.length > 0 ? (
                featuredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))
              ) : (
                <div className="col-span-full text-center py-20 glass-card border-dashed">
                  <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-xl text-muted-foreground font-serif">Our roasters are currently preparing the beans.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
