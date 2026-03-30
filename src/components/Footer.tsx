export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-20">
      <div className="container-content py-10 text-center space-y-2">
        <p className="text-caption text-muted uppercase tracking-widest">
          Powered by Claude AI &middot; Curated weekly
        </p>
        <p className="text-caption text-muted">
          &copy; {year} Rebranding Weekly. All article copyrights belong to their respective publishers.
        </p>
      </div>
    </footer>
  );
}
