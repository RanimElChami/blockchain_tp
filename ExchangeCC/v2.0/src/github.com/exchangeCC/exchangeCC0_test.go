package main

import (
	"os"
	"strconv"
	"testing"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-chaincode-go/shimtest"
)

var (
	excc *ExchangePlaceChaincode
	stub *shimtest.MockStub
)

func setup() {
	excc, err := contractapi.NewChaincode(new(ExchangePlaceChaincode))
	if err != nil {
		fmt.Printf("Error creating chaincode : %s", err.Error())
		panic(err)
	}
	stub = shimtest.NewMockStub("ExchangePlaceChaincode", excc)
}

func TestExcc_Init(t *testing.T) {
	res := stub.MockInit("", nil)
	if res.Status != shim.OK {
		t.Log("bad status received, expected: 200, received:" + strconv.FormatInt(int64(res.Status), 10))
		t.Log("Response: " + res.GetMessage())
		t.FailNow()
	}
}

// Init: A=200 , B=100
func TestExcc_InitLedger(t *testing.T) {
	res := stub.MockInvoke("Tx-Init", stringsToInvokePayload("Init", "A", "200", "B", "100"))
	if res.Status != shim.OK {
		t.Log(res.GetMessage())
		t.FailNow()
	}
}

// Invoke: Transfer 10 funds from A to B
func TestExcc_Invoke(t *testing.T) {
	res := stub.MockInvoke("Tx-1", stringsToInvokePayload("Invoke", "A", "B", "10"))
	if res.Status != shim.OK {
		t.Log(res.GetMessage())
		t.FailNow()
	}
}

// A should be 190 ; B should be 110
func TestExcc_Query(t *testing.T) {
	// check value of A
	res := stub.MockInvoke("Tx-2", stringsToInvokePayload("Query", "A"))
	if res.Status != shim.OK {
		t.Log(res.GetMessage())
		t.FailNow()
	}

	if string(res.Payload) != "190" {
		t.Log("expected 190, actual: " + string(res.Payload))
		t.FailNow()
	}

	// check value of B
	res = stub.MockInvoke("Tx-3", stringsToInvokePayload("Query", "B"))
	if res.Status != shim.OK {
		t.Log(res.GetMessage())
		t.FailNow()
	}

	if string(res.Payload) != "110" {
		t.Log("expected 110, actual: " + string(res.Payload))
		t.FailNow()
	}
}

func TestMain(m *testing.M) {
	setup()
	code := m.Run()
	os.Exit(code)
}

func stringsToInvokePayload(args ...string) [][]byte {
	var result [][]byte
	for _, v := range args {
		result = append(result, []byte(v))
	}
	return result
}