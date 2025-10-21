import { useRef, useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import MainMenu from "../components/MainMenu"
import ModalBox from "../components/ui/ModalBox"

export default function RootLayout() {
    const modalRef = useRef();
    const [modalContent, setModalContent] = useState();
    const [modalData, setModalData] = useState({});
    const [transCategory, setTransCategory] = useState({catId: ''})

    function loadCatTransactions(catDetails) {
        setTransCategory(catDetails)
    }

    function appModal(action, showContent, modalData) {       
        if (action === 'open') {
            modalRef.current.showModal();
            setModalContent(showContent);
            setModalData(modalData);
        }

        if (action === 'close') {
            modalRef.current.close();
            setModalContent(null);
            setModalData(null);
        }
    }

    const navigate = useNavigate()

    return (
        <>
            <MainMenu appModal={appModal} />
            <ModalBox ref={modalRef} modalContent={modalContent} appModal={appModal} modalData={modalData} loadCatTransactions={loadCatTransactions} />
            <div className='main-container'>
                <Outlet context={{appModal, transCategory, loadCatTransactions}} />
            </div>
        </>
    )
}