import FileUpload from './components/FileUpload';
import RuleBuilder from './components/RuleBuilder';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-sky-50 p-10 gap-10">
      <h1 className="text-4xl font-bold text-indigo-700"> Data Alchemist</h1>
      <FileUpload />
      <RuleBuilder
  data={[
    ['C001', 'Acme Inc', '2', 'T1', 'Tier1', '{"region": "west", "budget": 50000}']
  ]}
  headers={[
    'ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'
  ]}
/>

    </main>
  );
}
