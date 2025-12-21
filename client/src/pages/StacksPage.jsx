import React from 'react';
import './StacksPage.css';
import { useParams } from 'react-router-dom';
import stacksData from '../api/stacks.json';

function StacksPage() {
    const { fieldSlug } = useParams();

    const fieldData = stacksData.find(
        (item) => item.fieldSlug === fieldSlug
    );

    if (!fieldData) {
        return <h2>Field not found</h2>
    }


  return (
    <section className='stacks-container'>
      <h1 className='field-title'>{fieldData.field}</h1>

      {
        fieldData.type === "linear" ? (
            <p className='field-title'>{fieldData.note}</p>
        ) : (
            <div className='stacks-section'>
                {
                    fieldData.stacks.map((stack) => (
                        <div key={stack.id} className='stack-card'>
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
