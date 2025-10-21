import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../utils/backend";
import CategoryBar from "./ui/CategoryBar";
import LoadingSpinner from "./ui/LoadingSpinner";
import LoadingError from "./ui/LoadingError";

export default function CategoriesSection({ appModal, loadCatTransactions }) {

    const { data: categoriesData, isPending, isError } = useQuery({
        queryKey: ['getCategories'],
        queryFn: getCategories
    });

    return (
        <div className="sub-box categories-box">
            <div className="box-title"><p>Categories</p></div>
            <button className="add-trans-button" title="Add Category" onClick={() => appModal('open', 'addCategory')}> + </button>
            <div className="box-content">
                <div className="category-list">

                {isPending ? <LoadingSpinner height='200px' /> : isError ? <LoadingError contHeight='200px' contWidth='200px' imgHeight='50px'/> :
                    <>
                        {
                            categoriesData?.map((category, index) => (
                                <CategoryBar key={index} categoryDetails={category} loadCatTransactions={loadCatTransactions} />
                            ))
                        }
                    </>
                }
                </div>
            </div>
        </div>
    )
}