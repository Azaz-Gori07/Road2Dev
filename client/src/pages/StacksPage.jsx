import React from 'react';
import './StacksPage.css';
import { useParams } from 'react-router-dom';
import stacksData from '../api/stacks.json';
import { useNavigate } from 'react-router-dom';

function StacksPage() {

    const navigate = useNavigate();

    const handleClickStack = (stackSlug) => {
        navigate(`/learning/${fieldSlug}/${stackSlug}`);
    }

    const handleGoBack = () => {
        navigate(-1);
    }

    const { fieldSlug } = useParams();

    const fieldData = stacksData.find(
        (item) => item.fieldSlug === fieldSlug
    );

    if (!fieldData) {
        return <h2>Field not found</h2>
    }


    return (
        <section className='stacks-container'>
            <h1 className='heading'>{fieldData.field}</h1>

            {
                fieldData.type === "linear" ? (
                    <>
                        <p className='sub-title'>{fieldData.note}</p>
                        <div className="buttons">
                            <button className='button'>Start {fieldData.field}</button>
                            <button className='button' onClick={handleGoBack}>Go back</button>
                        </div>
                    </>

                ) : (
                    <div className='stacks-section'>
                        {
                            fieldData.stacks.map((stack) => (
                                <div key={stack.id} className='stack-card' onClick={() => handleClickStack(stack.slug)}>
                                    <h3 className='stackname'>{stack.name}</h3>
                                    <p className='stack-description'>{stack.description}</p>
                                </div>
                            ))
                        }
                    </div>
                )
            }
        </section>
    )
}

export default StacksPage
