import { useState, ChangeEvent } from "react";
import "./styles.css";
interface Option {
  value: string;
  label: string;
  dataTestId?: string;
}

interface Validation {
  message: string;
}

interface FormField {
  fieldId: string;
  type:
    | "text"
    | "tel"
    | "email"
    | "textarea"
    | "date"
    | "dropdown"
    | "radio"
    | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  dataTestId: string;
  validation?: Validation;
  options?: Option[];
  maxLength?: number;
  minLength?: number;
}

interface FormSection {
  sectionId: number;
  title: string;
  description: string;
  fields: FormField[];
}

interface FormResponse {
  message: string;
  form: {
    formTitle: string;
    formId: string;
    version: string;
    sections: FormSection[];
  };
}

export default function Home() {
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [formDef, setFormDef] = useState<FormResponse["form"] | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async () => {
    const res = await fetch(
      "https://dynamic-form-generator-9rl7.onrender.com/create-user",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber, name }),
      }
    );
    if (!res.ok) {
      alert("Registration failed");
      return;
    }
    const frm = await fetch(
      `https://dynamic-form-generator-9rl7.onrender.com/get-form?rollNumber=${rollNumber}`
    );
    const data: FormResponse = await frm.json();
    setFormDef(data.form);
  };

  const handleChange = (fieldId: string, v: any) => {
    setValues((prev) => ({ ...prev, [fieldId]: v }));
    setErrors((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const validateSection = (): boolean => {
    if (!formDef) return false;
    const sect = formDef.sections[currentSection];
    const newErrs: Record<string, string> = {};
    sect.fields.forEach((f) => {
      const val = values[f.fieldId];
      if (
        f.required &&
        (val === undefined ||
          val === "" ||
          (f.type === "checkbox" && (!Array.isArray(val) || !val.length)))
      ) {
        newErrs[f.fieldId] = f.validation?.message || "This field is required";
      }
      if (f.minLength && typeof val === "string" && val.length < f.minLength) {
        newErrs[f.fieldId] =
          f.validation?.message || `Minimum ${f.minLength} characters`;
      }
      if (f.maxLength && typeof val === "string" && val.length > f.maxLength) {
        newErrs[f.fieldId] =
          f.validation?.message || `Maximum ${f.maxLength} characters`;
      }
    });
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const next = () => {
    if (validateSection()) {
      setCurrentSection((i) => i + 1);
    }
  };
  const prev = () => setCurrentSection((i) => i - 1);
  const submit = () => {
    if (validateSection()) {
      console.log("Collected form data:", values);
      alert("Check console for submitted data");
    }
  };

  if (!formDef) {
    return (
      <div
        style={{
          maxWidth: 400,
          margin: "2rem auto",
          padding: "1rem",
          border: "1px solid #ccc",
        }}
      >
        <h2>Student Login</h2>
        <div>
          <label>Roll Number</label>
          <br />
          <input
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            className="rno"
          />
        </div>
        <div style={{ marginTop: "0.5rem" }}>
          <label>Name</label>
          <br />
          <input
            value={name}
            className="na"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button
          onClick={handleLogin}
          disabled={!rollNumber || !name}
          className="sub"
        >
          Login & Load Form
        </button>
      </div>
    );
  }

  const section = formDef.sections[currentSection];

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h1>{formDef.formTitle}</h1>
      <h3>{section.title}</h3>
      <p>{section.description}</p>

      {section.fields.map((f) => (
        <div key={f.fieldId} style={{ marginBottom: "1rem" }}>
          <label htmlFor={f.fieldId}>
            {f.label}
            {f.required && "*"}
          </label>
          <br />

          {["text", "tel", "email", "date"].includes(f.type) && (
            <input
              id={f.fieldId}
              data-testid={f.dataTestId}
              type={f.type}
              placeholder={f.placeholder}
              value={values[f.fieldId] || ""}
              onChange={(e) => handleChange(f.fieldId, e.target.value)}
            />
          )}

          {f.type === "textarea" && (
            <textarea
              id={f.fieldId}
              data-testid={f.dataTestId}
              placeholder={f.placeholder}
              value={values[f.fieldId] || ""}
              onChange={(e) => handleChange(f.fieldId, e.target.value)}
            />
          )}

          {f.type === "dropdown" && (
            <select
              id={f.fieldId}
              data-testid={f.dataTestId}
              value={values[f.fieldId] || ""}
              onChange={(e) => handleChange(f.fieldId, e.target.value)}
            >
              <option value="">Select...</option>
              {f.options?.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  data-testid={o.dataTestId}
                >
                  {o.label}
                </option>
              ))}
            </select>
          )}

          {f.type === "radio" &&
            f.options?.map((o) => (
              <label key={o.value} style={{ display: "block" }}>
                <input
                  type="radio"
                  name={f.fieldId}
                  value={o.value}
                  checked={values[f.fieldId] === o.value}
                  onChange={() => handleChange(f.fieldId, o.value)}
                />{" "}
                {o.label}
              </label>
            ))}

          {f.type === "checkbox" &&
            f.options?.map((o) => {
              const checkedArr: string[] = values[f.fieldId] || [];
              return (
                <label key={o.value} style={{ display: "block" }}>
                  <input
                    type="checkbox"
                    value={o.value}
                    checked={checkedArr.includes(o.value)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...checkedArr, o.value]
                        : checkedArr.filter((v) => v !== o.value);
                      handleChange(f.fieldId, next);
                    }}
                  />{" "}
                  {o.label}
                </label>
              );
            })}

          {errors[f.fieldId] && (
            <div style={{ color: "red", marginTop: "0.25rem" }}>
              {errors[f.fieldId]}
            </div>
          )}
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {currentSection > 0 ? (
          <button onClick={prev} className="sub">
            Prev
          </button>
        ) : (
          <div />
        )}
        {currentSection < formDef.sections.length - 1 ? (
          <button onClick={next} className="sub">
            Next
          </button>
        ) : (
          <button onClick={submit} className="sub">
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
