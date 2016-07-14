var Debugger = Debugger || {};

Debugger.Instructions = (function() {
    function executeInstruction(instructionObject, instructionObjects) {
        var param0 = instructionObject.param0;
        var param1 = instructionObject.param1;
        var param2 = instructionObject.param2;

        switch(param0.value) {
            case 'mov':
                if (Debugger.Helper.isTypeRegister(param2.type)) {
                    var value = Debugger.Helper.registerToRegisterValue(param2.value);
                }

                if (param2.type === 'val') {
                    value = param2.value;
                }

                Debugger.Helper.setRegister(param1.value, param1.type, value);

                break;

            case 'movzx':
                if (Debugger.Helper.isTypeRegister(param2.type)) {
                    var value = Debugger.Helper.registerToRegisterValue(param2.value);
                }

                Debugger.Helper.setRegister(param1.value, param1.type, value);

                break;

            case 'movsx':
                if (Debugger.Helper.isTypeRegister(param2.type)) {
                    var value = Debugger.Helper.registerToRegisterValue(param2.value);
                }

                var param1Size = Debugger.Helper.getSizeOfRegister(param1.type);
                var param2Size = Debugger.Helper.getSizeOfRegister(param2.type);
                var newValue = Debugger.Helper.signExtend(value, param2Size, param1Size);

                if (newValue === false) {
                    console.log('Could not sign extend');
                    return false;
                }

                Debugger.Helper.setRegister(param1.value, param1.type, newValue);

                break;

            /*
             * Convert byte to word.
             *
             * Takes the value in al and sign extends it into ax.
             */
            case 'cbw':
                var value = Debugger.Helper.register32AndTypeToRegisterValue('eax', 'reg8l');

                var fromSize = 8;
                var toSize = 16;
                var newValue = Debugger.Helper.signExtend(value, fromSize, toSize);

                if (newValue === false) {
                    console.log('Could not sign extend');
                    return false;
                }

                Debugger.Helper.setRegister('ax', 'reg16', newValue);

                break;

            /*
             * Convert word to double word.
             *
             * Takes the value in ax and sign extends it into eax.
             */
            case 'cwde':
                var value = Debugger.Helper.register32AndTypeToRegisterValue('eax', 'reg16');

                var fromSize = 16;
                var toSize = 32;
                var newValue = Debugger.Helper.signExtend(value, fromSize, toSize);

                if (newValue === false) {
                    console.log('Could not sign extend');
                    return false;
                }

                Debugger.Helper.setRegister('eax', 'reg32', newValue);

                break;

            /*
             * Convert word to double word.
             *
             * Takes the value in ax and sign extends it into dx:ax.
             */
            case 'cwd':
                var value = Debugger.Helper.register32AndTypeToRegisterValue('eax', 'reg16');

                if (Debugger.Helper.isSignedNegative(value, 16)) {
                    Debugger.Helper.setRegister('dx', 'reg16', (Math.pow(2, 16)-1));
                } else {
                    Debugger.Helper.setRegister('dx', 'reg16', 0);
                }

                break;


            /*
             * Convert double word to quad word
             *
             * Takes the value in eax and sign extends it into edx:eax.
             */
            case 'cdq':
                var value = Debugger.Helper.register32AndTypeToRegisterValue('eax', 'reg32');

                if (Debugger.Helper.isSignedNegative(value, 32)) {
                    Debugger.Helper.setRegister('edx', 'reg32', (Math.pow(2, 32)-1));
                } else {
                    Debugger.Helper.setRegister('edx', 'reg32', 0);
                }

                break;

            case 'add':
                var operand1 = Debugger.Helper.paramToRegisterValue(param1);

                if (Debugger.Helper.isTypeRegister(param2.type)) {
                    var operand2 = Debugger.Helper.paramToRegisterValue(param2);
                }

                if (param2.type === 'val') {
                    var operand2 = param2.value;
                }

                var result = Debugger.Helper.limitDec(operand1 + operand2);
                var type = 'add';

                /* Here we assume the first parameter always is a register */
                var resultSize = Debugger.Helper.getSizeOfRegister(Debugger.Helper.getTypeParam(param1.value));

                Debugger.Helper.setFlags(type, operand1, operand2, result, resultSize);
                Debugger.Helper.setRegister(param1.value, param1.type, result);

                break;

            case 'cmp':
            case 'sub':
                var operand1 = Debugger.Helper.paramToRegisterValue(param1);

                if (Debugger.Helper.isTypeRegister(param2.type)) {
                    var operand2 = Debugger.Helper.paramToRegisterValue(param2);
                }

                if (param2.type === 'val') {
                    var operand2 = param2.value;
                }

                var result = Debugger.Helper.limitDec(operand1 - operand2);
                var type = 'sub';

                /* Here we assume the first parameter always is a register */
                var resultSize = Debugger.Helper.getSizeOfRegister(Debugger.Helper.getTypeParam(param1.value));

                Debugger.Helper.setFlags(type, operand1, operand2, result, resultSize);

                // do not set registers when using "cmp"
                if (param0.value === 'sub') {
                    Debugger.Helper.setRegister(param1.value, param1.type, result);
                }

                break;

            case 'inc':
                var operand1 = Debugger.Helper.paramToRegisterValue(param1);
                var operand2 = 1;
                var result = Debugger.Helper.limitDec(operand1 + operand2);
                var type = 'add';

                var resultSize = Debugger.Helper.getSizeOfRegister(Debugger.Helper.getTypeParam(param1.value));

                Debugger.Helper.setFlags(type, operand1, operand2, result, resultSize);
                Debugger.Helper.setRegister(param1.value, param1.type, result);

                break;

            case 'dec':
                var operand1 = Debugger.Helper.paramToRegisterValue(param1);
                var operand2 = 1;
                var result = Debugger.Helper.limitDec(operand1 - operand2);
                var type = 'sub';

                var resultSize = Debugger.Helper.getSizeOfRegister(Debugger.Helper.getTypeParam(param1.value));

                Debugger.Helper.setFlags(type, operand1, operand2, result, resultSize);
                Debugger.Helper.setRegister(param1.value, param1.type, result);

                break;

            /*
             * Multiplication works like this:
             *
             * mul ecx (ecx * eax = edx:eax)
             * mul cx (cx * ax = dx:ax)
             * mul cl (cl * al = ah:al = ax)
             * mul ch (ch * al = ah:al = ax)
             */
            case 'mul':
                var value1 = Debugger.Helper.paramToRegisterValue(param1);

                // Get the same sized value out of the register in the eax register
                // Ensure the low 8 bit register
                var paramTypeLow = Debugger.Helper.ensure8BitLow(param1.type);
                var value2 = Debugger.Helper.register32AndTypeToRegisterValue('eax', paramTypeLow);

                var sizeRegister = Debugger.Helper.getSizeOfRegister(paramTypeLow);

                // Get the values to do "mul"
                var mulDivValues = Debugger.Vars.getMulDivValues(sizeRegister);

                // Calculate with bigInt's, in case we have a 64 bit answer
                var resultBin = bigInt(bigInt(value1).times(value2)).toString(2);

                /* create a double so long string */
                resultBin = Debugger.Helper.addPadding(resultBin, mulDivValues.size * 2, '0');

                var result1 = resultBin.substr(mulDivValues.size * -1);
                var result2 = resultBin.substr(0, mulDivValues.size);

                var result1Dec = Debugger.Helper.baseConverter(result1, 2, 10);
                var result2Dec = Debugger.Helper.baseConverter(result2, 2, 10);

                // Never set any flags

                Debugger.Helper.setRegister(
                    mulDivValues.register1,
                    Debugger.Helper.getTypeRegister(mulDivValues.register1),
                    result1Dec
                );
                Debugger.Helper.setRegister(
                    mulDivValues.register2,
                    Debugger.Helper.getTypeRegister(mulDivValues.register2),
                    result2Dec
                );

                break;

            /*
             * Divison works like this
             *
             * div ecx (edx:eax / ecx) remainder: edx, division: eax
             * div cx (dx:ax / cx) remainder: dx, division: ax
             * div cl (ah:al / cl) remainder: ah, division: al
             * div ch (ah:al / ch) remainder: ah, division: al
             *
             */
            case 'div':
                var value1 = Debugger.Helper.paramToRegisterValue(param1);

                // When we have reg8h or reg8l, we need "ah" and "al" (ah:al) as dividend
                // Else take the same register size out of eax and edx
                if (param1.type === 'reg8h' || param1.type === 'reg8l') {
                    var value2 = Debugger.Helper.registerToRegisterValue('ah', 2);
                    var value3 = Debugger.Helper.registerToRegisterValue('al', 2);
                } else {
                    var value2 = Debugger.Helper.register32AndTypeToRegisterValue('edx', param1.type, 2);
                    var value3 = Debugger.Helper.register32AndTypeToRegisterValue('eax', param1.type, 2);
                }

                var sizeRegister = Debugger.Helper.getSizeOfRegister(param1.type);

                // Get the values to do "div"
                var mulDivValues = Debugger.Vars.getMulDivValues(sizeRegister);

                // Use the "size" of mulDivValues to add padding
                value2 = Debugger.Helper.addPadding(value2, mulDivValues.size);
                value3 = Debugger.Helper.addPadding(value3, mulDivValues.size);

                var result = bigInt(bigInt(value2+value3, 2).divmod(value1));

                // Never set any flags

                Debugger.Helper.setRegister(
                    mulDivValues.register1,
                    Debugger.Helper.getTypeRegister(mulDivValues.register1),
                    result.quotient
                );
                Debugger.Helper.setRegister(
                    mulDivValues.register2,
                    Debugger.Helper.getTypeRegister(mulDivValues.register2),
                    result.remainder
                );

                break;

            /*
             * Loop jumps to a label when ecx is not zero. After every jump it decreases ecx.
             */
            case 'loop':
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                var ecx = Debugger.Helper.registerToRegisterValue('ecx');

                if (ecx !== 0) {
                    Debugger.Vars.instructionPointer = address;

                    // Decrease ecx
                    Debugger.Helper.setRegister('ecx', --ecx);
                }

                var operand1 = null;
                var operand2 = null;
                var type = 'loop';

                Debugger.Helper.setFlags(type, operand1, operand2, ecx);
                break;

            /*
             * Negates the number, it find's the two's complement.
             */
            case 'neg':
                var value1 = Debugger.Helper.paramToRegisterValue(param1);
                var size = Debugger.Helper.getSizeOfRegister(param1.type);

                var result = Debugger.Helper.twoComplement(value1, size);

                var type = 'neg';
                var operand1 = value1;
                var operand2 = result;
                var resultSize = Debugger.Helper.getSizeOfRegister(Debugger.Helper.getTypeParam(param1.value));

                Debugger.Helper.setFlags(type, operand1, operand2, result, resultSize);
                Debugger.Helper.setRegister(param1.value, param1.type, result);

                break;

            case 'jmp':
                var address;
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                Debugger.Vars.instructionPointer = address;
                break;

            case 'jz':
            case 'jnz':
            case 'js':
            case 'jns':
            case 'jc':
            case 'jnc':
            case 'jo':
            case 'jno':
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                var secondLetter = param0.value.substr(1,1);
                var thirdLetter = param0.value.substr(2,1);

                if (secondLetter === 'n' && Debugger.Config.flags[thirdLetter + 'f'] === 0) {
                    Debugger.Vars.instructionPointer = address;
                }

                if (secondLetter !== 'n' && Debugger.Config.flags[secondLetter + 'f'] === 1) {
                    Debugger.Vars.instructionPointer = address;
                }
                break;

            case 'jb':
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                if (Debugger.Config.flags['cf'] === 1) {
                    Debugger.Vars.instructionPointer = address;
                }
                break;

            case 'jbe':
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                if (Debugger.Config.flags['cf'] === 1 || Debugger.Config.flags['zf'] === 1) {
                    Debugger.Vars.instructionPointer = address;
                }
                break;

            case 'ja':
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                if (Debugger.Config.flags['cf'] === 0 && Debugger.Config.flags['zf'] === 0) {
                    Debugger.Vars.instructionPointer = address;
                }
                break;

            case 'jae':
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                if (Debugger.Config.flags['cf'] === 0) {
                    Debugger.Vars.instructionPointer = address;
                }
                break;

            case 'jl':
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                if (Debugger.Config.flags['sf'] !== Debugger.Config.flags['of']) {
                    Debugger.Vars.instructionPointer = address;
                }
                break;

            case 'jle':
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                if (Debugger.Config.flags['sf'] !== Debugger.Config.flags['of'] || Debugger.Config.flags['zf'] === 1) {
                    Debugger.Vars.instructionPointer = address;
                }
                break;

            case 'jg':
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                if (Debugger.Config.flags['sf'] === Debugger.Config.flags['of'] && Debugger.Config.flags['zf'] === 0) {
                    Debugger.Vars.instructionPointer = address;
                }
                break;

            case 'jge':
                if (!(address = Debugger.Helper.findLabelAddress(instructionObject.param1.value, instructionObjects))) {
                    console.log('Jump to, but label not found');
                    return false;
                }

                if (Debugger.Config.flags['sf'] === Debugger.Config.flags['of']) {
                    Debugger.Vars.instructionPointer = address;
                }
                break;

            default:
                console.log('No instruction execution found');
                break;
        }

        Debugger.Helper.echoInstruction(instructionObject);
        return true;
    }

    return {
        executeInstruction: executeInstruction
    };
})();
