import type { DetailedHTMLProps, HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes } from 'react'

type TableProps = DetailedHTMLProps<TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>
type RowProps = DetailedHTMLProps<HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>
type CellProps = DetailedHTMLProps<TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement> & {
  isHeader?: boolean
}

export const MarkdownTable = ({ children, className, ...props }: TableProps) => (
  <div className="my-6 overflow-x-auto shadow-sm rounded-lg border border-slate-200 dark:border-slate-800">
    <table className={`w-full border-collapse ${className || ''}`} {...props}>
      {children}
    </table>
  </div>
)

export const TableCell = ({ children, isHeader = false, className, ...props }: CellProps) => {
  const Component = isHeader ? 'th' : 'td'
  const baseClasses = 'px-4 py-3 text-sm'
  const headerClasses = 'bg-slate-800 text-white dark:bg-slate-700 font-semibold text-left border-b-2 border-slate-600'
  const cellClasses = 'border-t border-slate-200 dark:border-slate-700'

  return (
    <Component 
      className={`${baseClasses} ${isHeader ? headerClasses : cellClasses} ${className || ''}`}
      {...props}
    >
      {children}
    </Component>
  )
}

export const TableRow = ({ children, className, ...props }: RowProps) => (
  <tr className={className} {...props}>{children}</tr>
)
