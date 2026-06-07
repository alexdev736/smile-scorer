export default function Footer() {
  return (
    <footer style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginTop: 'auto' }}>
      <p>&copy; {new Date().getFullYear()} SmileScorer. All rights reserved.</p>
    </footer>
  );
}
