import { redirect } from 'next/navigation';

export default function DrilldownRedirect() {
  redirect('/benchmarks/polymarket/explorer#categories');
}
