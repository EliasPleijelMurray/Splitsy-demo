import Button from "../components/Button";
import { Link } from "react-router";

export const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-88px)] px-6 py-12">
      <div className="max-w-4xl w-full">
        {/* Main Heading */}
        <h1 className="text-center font-receipt mb-16 tracking-tight uppercase">
          SPLIT EXPENSES. STAY ORGANIZED. STAY FAIR.
        </h1>

        {/* Feature Cards Container */}
        <div className="relative mb-20">
          {/* First Card - Top Left */}
          <div className="bg-card border-2 border-black p-6 max-w-sm mb-8">
            <h3 className="font-semibold mb-2">Automatic Calculations</h3>
            <p className="text-base leading-relaxed">
              No more math or spreadsheets. Add your expenses and the app
              instantly keeps track of who owes what.
            </p>
          </div>

          {/* Second Card - Middle Right */}
          <div className="bg-card border-2 border-black p-6 max-w-sm ml-auto mb-8">
            <h3 className="font-semibold mb-2">Log Expenses Your Way</h3>
            <p className="text-base leading-relaxed">
              Add purchases whenever you want — daily or all at once at the end
              of the month. The app adjusts everything for you automatically.
            </p>
          </div>

          {/* Third Card - Bottom Left */}
          <div className="bg-card border-2 border-black p-6 max-w-sm">
            <h3 className="font-semibold mb-2">Groups for Any Occasion</h3>
            <p className="text-base leading-relaxed">
              Living together, traveling, or sharing monthly costs? Create
              groups for each situation and keep everything neatly organized.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="flex items-center justify-center gap-4">
          <p className="text-base font-receipt">
            START{" "}
            <span className="text-primary font-semibold font-receipt">
              SPLITTING
            </span>{" "}
            ---&gt;
          </p>
          <Link to="/login">
            <Button>Create account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
