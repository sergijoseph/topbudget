import Profile from "../modals/Profile"
import AddAccount from "../modals/AddAccount";
import EditAccount from "../modals/EditAccount";
import AddCategory from "../modals/AddCategory";
import EditCategory from "../modals/EditCategory";
import AddTransaction from "../modals/AddTransaction";
import EditTransaction from "../modals/EditTransaction";

export default function ModalBox({ ref, modalContent, appModal, modalData, loadCatTransactions }) {

    let displayContent;
    let displayTitle;

    switch (modalContent) {
        case 'profile':
            displayContent = <Profile appModal={appModal} />
            displayTitle = "Profile"
            break;
        case 'addAccount':
            displayContent = <AddAccount appModal={appModal} />
            displayTitle = "Add Account"
            break;
        case 'editAccount':
            displayContent = <EditAccount appModal={appModal} modalData={modalData} />
            displayTitle = "Edit Account"
            break;
        case 'addCategory':
            displayContent = <AddCategory appModal={appModal} />
            displayTitle = "Add Category"
            break;
        case 'editCategory':
            displayContent = <EditCategory appModal={appModal} modalData={modalData} loadCatTransactions={loadCatTransactions} />
            displayTitle = "Edit Category"
            break;
        case 'addTransaction':
            displayContent = <AddTransaction appModal={appModal} modalData={modalData}/>
            displayTitle = "Add Transaction"
            break;
        case 'editTransaction':
            displayContent = <EditTransaction appModal={appModal} modalData={modalData} loadCatTransactions={loadCatTransactions} />
            displayTitle = "Edit Transaction"
            break;

        default:
            break;
    }

    return (
        <dialog className="modal-box" ref={ref}>
            <div className="modal-title">
                <p>{displayTitle}</p>
                <button onClick={() => appModal('close')} className="modal-x-button">X</button>
            </div>
            {displayContent}
        </dialog>
    )
}