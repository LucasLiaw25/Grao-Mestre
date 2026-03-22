import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <h2 className="font-serif text-3xl font-bold tracking-tight mb-6">Grão Mestre.</h2>
            <p className="text-secondary-foreground/70 max-w-sm text-balance leading-relaxed">
             Elevando o ritual diário. Nós selecionamos, torramos e entregamos os cafés mais extraordinários do mundo, diretamente à sua porta.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-6 tracking-wide uppercase text-sm text-primary">Shop</h3>
            <ul className="space-y-4">
              <li><Link to="/products" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">Todos os Produtos</Link></li>
              <li><Link to="/products" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">Origem Única</Link></li>
              <li><Link to="/products" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">Misturas</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-6 tracking-wide uppercase text-sm text-primary">Compania</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">Nossa História</a></li>
              <li><a href="#" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">Sustentabilidade</a></li>
              <li><a href="#" className="text-secondary-foreground/70 hover:text-secondary-foreground transition-colors">Contato</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-secondary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/50">
            © {new Date().getFullYear()} Grão Mestre. Todos os direitos reservados.
          </p>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-secondary-foreground/50 hover:text-secondary-foreground transition-colors">Política de Privacidade</a>
            <a href="#" className="text-secondary-foreground/50 hover:text-secondary-foreground transition-colors">Termos de Serviço</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
