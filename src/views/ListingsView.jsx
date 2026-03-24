import { useState, useMemo, createElement } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender
} from '@tanstack/react-table';
import { 
  ArrowUpDown, 
  Search, 
  Filter,
  Plus,
  MoreHorizontal,
  Building2,
  DollarSign,
  Users,
  TrendingUp
} from 'lucide-react';

// Sample Data
const SAMPLE_PROPERTIES = [
  { id: 1, address: '1500 Michael Drive, Welland', type: 'Industrial', price: 2500000, sqft: 45000, status: 'Active', zoning: 'M1', year: 2005, buyerMatches: 12 },
  { id: 2, address: '2200 Glendale Ave, Niagara Falls', type: 'Retail', price: 1800000, sqft: 12000, status: 'Active', zoning: 'C3', year: 1998, buyerMatches: 8 },
  { id: 3, address: '3500 Industrial Rd, St. Catharines', type: 'Warehouse', price: 4200000, sqft: 80000, status: 'Pending', zoning: 'M2', year: 2010, buyerMatches: 15 },
  { id: 4, address: '1200 Main St, Port Colborne', type: 'Office', price: 950000, sqft: 8000, status: 'Active', zoning: 'C2', year: 1995, buyerMatches: 5 },
  { id: 5, address: '500 Commerce Blvd, Thorold', type: 'Industrial', price: 3100000, sqft: 55000, status: 'Active', zoning: 'M1', year: 2008, buyerMatches: 10 },
  { id: 6, address: '800 Regional Rd, Fort Erie', type: 'Retail', price: 1450000, sqft: 15000, status: 'Sold', zoning: 'C3', year: 2002, buyerMatches: 0 },
];

// Status Badge Component
function StatusBadge({ status }) {
  const styles = {
    Active: 'bg-status-active/10 text-status-active border-status-active/20',
    Pending: 'bg-status-pending/10 text-status-pending border-status-pending/20',
    Sold: 'bg-status-sold/10 text-status-sold border-status-sold/20',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.Active}`}>
      {status}
    </span>
  );
}

// KPI Card Component
function KPICard({ icon, title, value, change, changeType }) {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="p-2 bg-background-tertiary rounded-lg">
          {createElement(icon, { size: 20, className: 'text-coral' })}
        </div>
        {change && (
          <span className={`text-xs font-medium ${changeType === 'positive' ? 'text-status-active' : 'text-gray-500'}`}>
            {change}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{title}</div>
      </div>
    </div>
  );
}

// Data Table Component
function DataTable({ data, columns }) {
  const [globalFilter, setGlobalFilter] = useState('');
  
  // TanStack Table intentionally returns dynamic functions that React Compiler won't memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  return (
    <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
      {/* Table Header with Search */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search properties..."
            className="w-full bg-background-tertiary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-coral/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-background-tertiary border border-border rounded-lg text-sm text-gray-300 hover:text-white hover:border-coral/50 transition-colors">
            <Filter size={14} />
            Filters
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-coral text-white rounded-lg text-sm hover:bg-coral-light transition-colors">
            <Plus size={14} />
            Add Property
          </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background-tertiary">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-border cursor-pointer hover:text-white"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown size={12} className="text-gray-600" />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-background-tertiary/50 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="p-4 border-t border-border flex items-center justify-between text-sm text-gray-500">
        <span>Showing {table.getRowModel().rows.length} of {data.length} properties</span>
        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-1.5 bg-background-tertiary border border-border rounded-lg hover:border-coral/50 disabled:opacity-40"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </button>
          <button 
            className="px-3 py-1.5 bg-background-tertiary border border-border rounded-lg hover:border-coral/50 disabled:opacity-40"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Listings View
export default function ListingsView() {
  const columns = useMemo(() => [
    {
      accessorKey: 'address',
      header: 'Property Address',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-white">{row.original.address}</div>
          <div className="text-xs text-gray-500">{row.original.type} • Built {row.original.year}</div>
        </div>
      )
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => (
        <span className="px-2 py-1 bg-background-tertiary rounded text-xs">{getValue()}</span>
      )
    },
    {
      accessorKey: 'zoning',
      header: 'Zoning',
      cell: ({ getValue }) => (
        <span className="text-coral font-medium">{getValue()}</span>
      )
    },
    {
      accessorKey: 'sqft',
      header: 'Size',
      cell: ({ getValue }) => `${getValue().toLocaleString()} sq ft`
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ getValue }) => `$${(getValue() / 1000000).toFixed(2)}M`
    },
    {
      accessorKey: 'buyerMatches',
      header: 'Matches',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Users size={14} className="text-gray-500" />
          <span className={getValue() > 10 ? 'text-status-active' : 'text-gray-400'}>
            {getValue()}
          </span>
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />
    },
    {
      id: 'actions',
      header: '',
      cell: () => (
        <button className="p-1.5 hover:bg-background-tertiary rounded-lg text-gray-500 hover:text-white">
          <MoreHorizontal size={16} />
        </button>
      )
    }
  ], []);
  
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">My Listings</h1>
        <p className="text-gray-500 text-sm">Manage your commercial real estate portfolio</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard 
          icon={Building2} 
          title="Total Properties" 
          value="24" 
          change="+3 this month" 
          changeType="positive"
        />
        <KPICard 
          icon={DollarSign} 
          title="Portfolio Value" 
          value="$42.8M" 
          change="+12%" 
          changeType="positive"
        />
        <KPICard 
          icon={Users} 
          title="Buyer Matches" 
          value="156" 
          change="+8 today" 
          changeType="positive"
        />
        <KPICard 
          icon={TrendingUp} 
          title="Avg. Days on Market" 
            value="18" 
          change="-5 days" 
          changeType="positive"
        />
      </div>
      
      {/* Properties Table */}
      <DataTable data={SAMPLE_PROPERTIES} columns={columns} />
    </div>
  );
}
