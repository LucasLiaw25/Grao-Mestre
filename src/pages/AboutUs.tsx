// src/pages/AboutUs.tsx
import { motion, useScroll, useTransform } from "framer-motion";
import { Scale, Heart, Compass, Target, Clock4, Award, Handshake } from "lucide-react";
import { Footer } from "@/components/Footer";

export default function AboutUs() {
  const { scrollY } = useScroll();

  // Parallax and Opacity effects for the Hero
  const heroY = useTransform(scrollY, [0, 1000], [0, 400]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  // Smooth section background transitions based on scroll
  const dynamicBackground = useTransform(
    scrollY,
    [300, 700, 1100, 1500, 1900, 2300],
    [
      "hsl(30, 25%, 97%)", // Start Beige
      "hsl(32, 28%, 95%)", // Softer Beige
      "hsl(28, 20%, 93%)", // Slightly Cooler Beige
      "hsl(30, 25%, 97%)", // Revert to Beige
      "hsl(32, 28%, 95%)", // Softer Beige
      "hsl(30, 25%, 97%)", // Revert to Beige
    ]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* HERO SECTION */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background z-10" />
          <img
            src="https://plus.unsplash.com/premium_photo-1668472274328-cd239ae3586f?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjR8fGNhZmV0ZXJpYXxlbnwwfHwwfHx8MA%3D%3D"
            alt="Artisanal coffee lab"
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
            Our Tradition
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-8 leading-[1.1]"
          >
            The Heritage
            <br />
            <span className="text-primary-foreground/90 italic">of Taste.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
          >
            A legacy forged in the perfect roast, where every bean tells a story of craftsmanship and ethical pursuit.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-primary-foreground/60"
        >
          <span className="text-xs uppercase tracking-widest font-semibold">Our Story</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-primary-foreground/60 to-transparent" />
        </motion.div>
      </section>

      {/* DYNAMIC CONTENT CONTAINER */}
      <motion.main style={{ backgroundColor: dynamicBackground }} className="relative z-20">
        
        {/* OUR JOURNEY SECTION */}
        <section className="py-24 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-150px" }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <span className="section-label">A Chronicle of Coffee</span>
              <h2 className="section-title">The Grand Master’s Tale</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Founded on the belief that coffee is a ritual, not just a drink, The Grand Master began in a small, dedicated roasting lab. Our founder, a master roaster with decades of experience, sought to honor the bean’s origin above all else.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe the perfect roast is an art form—a meticulous balance between tradition and innovation. From sourcing directly from single-estate farms to custom-profiling each batch, every step is executed with precision and respect. This dedication ensures that the unique terroir of every bean is celebrated in your cup.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-150px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/50 shadow-lg"
            >
              <img
                src="https://plus.unsplash.com/premium_photo-1667621221108-d9ff42adee84?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y29mZmVlJTIwZXF1aXBhbWVudHxlbnwwfHwwfHx8MA%3D%3D"
                alt="Vintage coffee roasting equipment"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </section>

        {/* OUR VALUES SECTION */}
        <section id="values" className="py-24 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="section-label"
            >
              Our Philosophy
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="section-title"
            >
              The Pillars of Excellence
            </motion.h2>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Scale, title: "Uncompromising Integrity", desc: "We adhere to the highest standards, from ethical sourcing to transparent business practices." },
              { icon: Compass, title: "Artisanal Precision", desc: "Every roast profile is meticulously crafted to honor the bean’s unique origin and flavor." },
              { icon: Target, title: "Sustainable Pursuit", desc: "Our direct-trade model ensures fair wages for farmers and environmentally conscious practices." },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="text-center group border border-border/50 p-8 rounded-2xl bg-card hover:border-primary/50 transition-colors duration-300"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-accent rounded-2xl flex items-center justify-center group-hover:-translate-y-2 transition-transform duration-300 shadow-sm">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-bold mb-4">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* MEET THE MASTERS SECTION */}
        <section className="py-24 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-150px" }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border/50 shadow-lg"
            >
              <img
                src="https://media.istockphoto.com/id/1263570103/pt/foto/barista-in-smokey-roastery-landscape.webp?a=1&b=1&s=612x612&w=0&k=20&c=oJFCVASnwgreu_ILl3pe_u4BA_0c6PrfP_O56RdwIVs="
                alt="A master roaster checking the beans"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-150px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <span className="section-label">Meet the Artisans</span>
              <h2 className="section-title">The Roasting Maestros</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our team of dedicated roasters are more than technicians; they are artists with a profound understanding of coffee chemistry. Each batch is a testament to their expertise and unwavering commitment to quality.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="flex items-start gap-3">
                    <Award className="w-6 h-6 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold text-foreground">Award-Winning Expertise</h4>
                        <p className="text-sm text-muted-foreground">Certified professionals in cupping and profile roasting.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Handshake className="w-6 h-6 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold text-foreground">Direct Trade Masters</h4>
                        <p className="text-sm text-muted-foreground">Building lasting relationships with premium single-estate farms.</p>
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* COMMITMENTS SECTION */}
        <section className="py-24 bg-muted/30 relative border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="section-label"
            >
              Our Commitments
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="section-title"
            >
              Beyond the Bean
            </motion.h2>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
                { title: "Direct Trade Sustainability", desc: "By bypassing traditional intermediaries, we ensure farmers are paid a premium price, fostering sustainable agricultural practices and vibrant coffee communities.", image: "https://images.unsplash.com/photo-1596707328221-50e5616b3f71?auto=format&fit=crop&q=80&w=800" },
                { title: "Artisanal Freshness", desc: "Every order is small-batch roasted and shipped weekly, guaranteeing the peak freshness and complex flavor profiles of the original bean.", image: "https://images.unsplash.com/photo-1579737402927-995f50f75c6d?auto=format&fit=crop&q=80&w=800" },
            ].map((commitment, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: i * 0.2 }}
                    className="flex flex-col md:flex-row gap-8 glass-card border-dashed p-6 items-center"
                >
                    <div className="relative w-full md:w-48 aspect-square rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                        <img src={commitment.image} alt={commitment.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-3 text-center md:text-left">
                        <h3 className="font-serif text-2xl font-bold">{commitment.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{commitment.desc}</p>
                    </div>
                </motion.div>
            ))}
          </div>
        </section>

      </motion.main>

      <Footer />
    </div>
  );
}