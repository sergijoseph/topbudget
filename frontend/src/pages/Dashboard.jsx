import { useOutletContext } from "react-router-dom";
import CategoriesSection from "../components/CategoriesSection";
import TransactionsSection from "../components/TransactionsSection";
import UpcomingSection from "../components/UpcomingSection";

export default function Dashboard() {
    const { appModal, transCategory, loadCatTransactions } = useOutletContext()

    return (
        <div className="dashboard-container">
            <CategoriesSection appModal={appModal} loadCatTransactions={loadCatTransactions}/>
            <TransactionsSection appModal={appModal} catDetails={transCategory} loadCatTransactions={loadCatTransactions}/>
            <UpcomingSection appModal={appModal} />
        </div>

    );
}