import * as React from "react";

const Table = React.forwardRef<
	HTMLTableElement,
	React.HTMLAttributes<HTMLTableElement>
>(({ className = "", ...props }, ref) => (
	<table
		ref={ref}
		className={[
			"w-full min-w-max border-separate border-spacing-0 caption-bottom text-sm",
			"[&_th]:border-border [&_td]:border-border",
			"[&_th]:border-l [&_th]:border-t [&_td]:border-l [&_td]:border-t",
			"[&_th:last-child]:border-r [&_td:last-child]:border-r",
			"[&_tbody_tr:last-child_td]:border-b [&_thead_tr_th]:border-b",
			className,
		].join(" ")}
		{...props}
	/>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => (
	<thead ref={ref} className={[className].join(" ")} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => (
	<tbody ref={ref} className={[className].join(" ")} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", ...props }, ref) => (
	<tfoot
		ref={ref}
		className={["bg-muted/50 font-medium", className].join(" ")}
		{...props}
	/>
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
	HTMLTableRowElement,
	React.HTMLAttributes<HTMLTableRowElement>
>(({ className = "", ...props }, ref) => (
	<tr
		ref={ref}
		className={[
			"transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
			className,
		].join(" ")}
		{...props}
	/>
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className = "", ...props }, ref) => (
	<th
		ref={ref}
		className={[
			"h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
			className,
		].join(" ")}
		{...props}
	/>
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className = "", ...props }, ref) => (
	<td
		ref={ref}
		className={[
			"p-4 align-middle [&:has([role=checkbox])]:pr-0",
			className,
		].join(" ")}
		{...props}
	/>
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className = "", ...props }, ref) => (
	<caption
		ref={ref}
		className={["mt-4 text-sm text-muted-foreground", className].join(" ")}
		{...props}
	/>
));
TableCaption.displayName = "TableCaption";

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
};
