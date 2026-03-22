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
            src="https://images.unsplash.com/photo-1512568400610-62da28bc8a13?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGNvZmZlZXxlbnwwfHwwfHx8MA%3D%3D"
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
            A Herança
            <br />
            <span className="text-primary-foreground/90 italic">da Torra.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-12 font-light leading-relaxed"
          >
           Um legado forjado na torra perfeita, onde cada grão conta uma história de artesanato e busca ética.
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
              <span className="section-label">Uma Crônica do Café</span>
              <h2 className="section-title">O Conto do Grande Mestre</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Fundado na crença de que o café é um ritual, não apenas uma bebida, o The Grand Master começou em um pequeno laboratório de torrefação dedicado. Nosso fundador, um mestre torrefador com décadas de experiência, buscava honrar a origem do grão acima de tudo.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Acreditamos que o torra perfeito é uma forma de arte—um equilíbrio meticuloso entre tradição e inovação. Desde a obtenção direta de fazendas de propriedade única até a personalização do perfil de cada lote, cada etapa é executada com precisão e respeito. Essa dedicação garante que o terroir único de cada grão seja celebrado em sua xícara.
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
              Nossa Filosofia
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="section-title"
            >
              Os Pilares da Excelência
            </motion.h2>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Scale, title: "Integridade Inflexível", desc: "Nós aderimos aos mais altos padrões, desde a aquisição ética até práticas comerciais transparentes." },
              { icon: Compass, title: "Precisão Artesanal", desc: "Cada perfil de torra é meticulosamente elaborado para honrar a origem e o sabor únicos do grão." },
              { icon: Target, title: "Busca Sustentável", desc: "Nosso modelo de comércio direto garante salários justos para os agricultores e práticas ambientalmente conscientes." },
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
              <span className="section-label">Conheça os Artesãos</span>
              <h2 className="section-title">Os Mestres da Torrefação</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Nossa equipe de torradores dedicados é mais do que técnicos; eles são artistas com um profundo entendimento da química do café. Cada lote é um testemunho de sua experiência e compromisso inabalável com a qualidade.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="flex items-start gap-3">
                    <Award className="w-6 h-6 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold text-foreground">Especialização Premiada</h4>
                        <p className="text-sm text-muted-foreground">Profissionais certificados em degustação e torra de perfil.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Handshake className="w-6 h-6 text-primary mt-1" />
                    <div>
                        <h4 className="font-semibold text-foreground">Mestres do Comércio Direto</h4>
                        <p className="text-sm text-muted-foreground">Construindo relacionamentos duradouros com fazendas de propriedade única premium.</p>
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
              Além do Grão
            </motion.h2>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
                { title: "Sustentabilidade do Comércio Direto", desc: "Ao contornar intermediários tradicionais, garantimos que os agricultores recebam um preço premium, promovendo práticas agrícolas sustentáveis e comunidades cafeeiras vibrantes.", image: "https://media.istockphoto.com/id/2171791440/pt/foto/close-up-of-a-woman-holding-sprout-young-plant-outdoors.webp?a=1&b=1&s=612x612&w=0&k=20&c=ocHcda2BzOEzZGRx5MJihhaveSRrdzrRmbasLC3pt74="},
                { title: "Frescor Artesanal", desc: "Cada pedido é torrado em pequenos lotes e enviado semanalmente, garantindo a máxima frescura e os perfis de sabor complexos do grão original.", image: "https://plus.unsplash.com/premium_photo-1723924888387-5868b4e28778?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Z3Jhb3MlMjBkZSUyMGNhZmV8ZW58MHx8MHx8fDA%3D"},
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