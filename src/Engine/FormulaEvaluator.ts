import Cell from "./Cell"
import SheetMemory from "./SheetMemory"
import { ErrorMessages } from "./GlobalDefinitions";



export class FormulaEvaluator {
  // Define a function called update that takes a string parameter and returns a number
  private _errorOccured: boolean = false;
  private _errorMessage: string = "";
  private _currentFormula: FormulaType = [];
  private _lastResult: number = 0;
  private _sheetMemory: SheetMemory;
  private _result: number = 0;


  constructor(memory: SheetMemory) {
    this._sheetMemory = memory;
  }

  /**
  * place holder for the evaluator.   I am not sure what the type of the formula is yet 
  * I do know that there will be a list of tokens so i will return the length of the array
  * 
  * I also need to test the error display in the front end so i will set the error message to
  * the error messages found In GlobalDefinitions.ts
  * 
  * according to this formula.
  * 
  7 tokens partial: "#ERR",
  8 tokens divideByZero: "#DIV/0!",
  9 tokens invalidCell: "#REF!",
  10 tokens invalidFormula: "#ERR",
  11 tokens invalidNumber: "#ERR",
  12 tokens invalidOperator: "#ERR",
  13 missingParentheses: "#ERR",
  0 tokens emptyFormula: "#EMPTY!",

                    When i get back from my quest to save the world from the evil thing i will fix.
                      (if you are in a hurry you can fix it yourself)
                               Sincerely 
                               Bilbo
  * 
  */
  
  /**
   * A helper function to check if the formula is valid, if not set the error message
   * @param formula the input formula
   * @returns the result of the formula
   */
  calculate(formula: FormulaType) : number{
        const stack: number[] = [];
        let num: number = 0.0;
        let sign: string = '+';

        const n: number = formula.length;
        this._errorMessage = "";
        if (n === 0) {
          // Set an error message for an empty formula
          this._errorOccured = true;
          this._errorMessage = ErrorMessages.emptyFormula;
          return 0;
        }
        for (let i: number = 0; i < n; i++) {
            const current: string = formula[i];
            if (/^[\d.]+$/.test(current)) { // Allow decimal numbers
              num = parseFloat(current);
            }
            if (this.isCellReference(current)) {
                let [value, error] = this.getCellValue(current);
                if (error !== "") {
                    this._errorOccured = true;
                    this._errorMessage = error;
                    return 0;
                }
                num = value;

            }
            // if the current token is a left parentheses
            // find the matching right parentheses and evaluate the expression in between
            if (current === '(') {
                // if the formula ends with a left parentheses return invalid formula error
                if(i === n - 1) {
                  this._errorOccured = true;
                  this._errorMessage = ErrorMessages.invalidFormula;
                  return num;
                }
                // if the next token is a right parentheses return invalid missingParentheses error
                if (formula[i + 1] === ')') {
                  this._errorOccured = true;
                  this._errorMessage = ErrorMessages.missingParentheses;
                    return 0;
                }
              
                let j: number = i + 1;
                let braces: number = 1;
                for (; j < n; j++) {
                    if (formula[j] === '(') ++braces;
                    if (formula[j] === ')') --braces;
                    if (braces === 0) break;
                }
                
                num = this.calculate(formula.slice(i + 1, j));
                i = j;
            }
            
            // if the current token is an operator or the formula ends
            if ( current === '+' || current === '-' || current === '*' || current === '/' || i === n - 1) {
              
              switch (sign) {
                    case '+':
                        stack.push(num);
                        break;
                    case '-':
                        stack.push(-num);
                        break;
                    case '*':
                        stack.push(stack.pop()! * num);
                        break;
                    case '/':
                      // if the divisor is zero return divideByZero error
                        if(num === 0){
                          this._errorOccured = true;
                          this._errorMessage = ErrorMessages.divideByZero;
                          return Infinity;
                        }
                        stack.push(stack.pop()! / num);
                        break;
                }
                num = 0.0;
                sign = current;
            }

        }
        //if the formula end with an operator return invalid formula error
        if(formula[n-1] === '+' || formula[n-1] === '-' || formula[n-1] === '*' || formula[n-1] === '/'){
          this._errorOccured = true;
          this._errorMessage = ErrorMessages.invalidFormula;
        }
        // sum up the result
        let result: number = 0;
        while (stack.length > 0) result += stack.pop()!;

        return result;
  }

  /**
   * evaluate the formula
   * @param formula
   * @returns the result of the formula
  **/
  evaluate(formula: FormulaType){
    this._result = this.calculate(formula);
  }

  /**
   * 
   * @returns error message
   */
  public get error(): string {
    return this._errorMessage
  }

  /**
   * 
   * @returns the result of the formula
   */
  public get result(): number {
    return this._result;
  }

  /**
   * 
   * @param token 
   * @returns true if the token can be parsed to a number
   */
  isNumber(token: TokenType): boolean {
    return !isNaN(Number(token));
  }

  /**
   * 
   * @param token
   * @returns true if the token is a cell reference
   * 
   */
  isCellReference(token: TokenType): boolean {

    return Cell.isValidCellLabel(token);
  }

  /**
   * 
   * @param token
   * @returns [value, ""] if the cell formula is not empty and has no error
   * @returns [0, error] if the cell has an error
   * @returns [0, ErrorMessages.invalidCell] if the cell formula is empty
   * 
   */
  getCellValue(token: TokenType): [number, string] {

    let cell = this._sheetMemory.getCellByLabel(token);
    let formula = cell.getFormula();
    let error = cell.getError();

    // if the cell has an error return 0
    if (error !== "" && error !== ErrorMessages.emptyFormula) {
      return [0, error];
    }

    // if the cell formula is empty return 0
    if (formula.length === 0) {
      return [0, ErrorMessages.invalidCell];
    }


    let value = cell.getValue();
    return [value, ""];

  }


}

export default FormulaEvaluator;