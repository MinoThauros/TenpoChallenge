import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function TableShowcase() {
  return (
    <section id='table'>
      <h3 className='text-h4 mb-8'>Table</h3>

      <div className='bg-card rounded-sm border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Camp</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className='text-right'>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className='font-medium'>Soccer Skills</TableCell>
              <TableCell>8-10 years</TableCell>
              <TableCell>1 week</TableCell>
              <TableCell className='text-right'>$299</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className='font-medium'>Basketball Basics</TableCell>
              <TableCell>11-13 years</TableCell>
              <TableCell>2 weeks</TableCell>
              <TableCell className='text-right'>$549</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className='font-medium'>Multi-Sport</TableCell>
              <TableCell>5-7 years</TableCell>
              <TableCell>3 days</TableCell>
              <TableCell className='text-right'>$149</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
