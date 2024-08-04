import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function FilterOptionsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Filters</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Filters</DialogTitle>
          <DialogDescription className="text-lg mt-2">
            Available filters for the Magic Filter input:
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filterOptions.map((option, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{option.title}</h3>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          ))}
        </div>
        <DialogFooter className="mt-8">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const filterOptions = [
  {
    title: "Names",
    description: "Filter orders by Fruit name (lowercase only).",
  },
  {
    title: "Form",
    description:
      "Filter fruits by the form they are in (e.g., 'Canned').",
  },
];
